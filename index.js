const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function setupPython() {
  try {
    const requirementsFile = core.getInput("requirements-file", { required: false }) || "requirements.txt";

    core.startGroup("Setup python environment");
    await exec.exec("python", ["--version"]);
    core.endGroup();

    core.startGroup("Upgrade pip");
    await exec.exec("python", ["-m", "pip", "install", "--upgrade", "pip"]);
    core.endGroup();

    core.startGroup("Install python dependencies");
    await exec.exec("pip", ["install", "--cache-dir", `${process.env.HOME}/.cache/pip`, "-r", requirementsFile]);
    core.info("Python dependencies installed");
    core.endGroup();

    core.info("Python environment ready");
  } catch (err) {
    core.setFailed(`Failed in python setup: ${err.message}`);
  }
}

async function uploadMode() {
  try {
    // Map JORDAN environment variables to LOCI variables that loci_api expects
    if (process.env.JORDAN_API_TOKEN) {
      process.env.LOCI_API_KEY = process.env.JORDAN_API_TOKEN;
    }
    if (process.env.JORDAN_BACKEND_URL) {
      process.env.LOCI_BACKEND_URL = process.env.JORDAN_BACKEND_URL;
    }

    const iProject  = core.getInput("project", { required: true });
    const iVersion  = core.getInput("version", { required: true });
    const iBinaries = core.getInput("binaries", { required: true });

    const binaries = iBinaries
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    core.startGroup("Collect binaries");
    binaries.forEach((file) => core.info(`- ${file}`));
    core.endGroup();

    core.startGroup("Archive binaries");
    const binsArchive = path.join(process.cwd(), "binaries.tar.xz");
    await exec.exec("tar", ["-cf", binsArchive, ...binaries]);
    await exec.exec("ls", ["-lh", binsArchive]);
    core.info("Binaries archived");
    core.endGroup();

    core.startGroup("Upload new project version to loci");
    await exec.exec("loci_api", ["upload", binsArchive, iProject, iVersion]);
    core.info("Project version uploaded");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Upload failed: ${err.message}`);
  }
}

async function insightsMode() {
  try {
    // Map JORDAN environment variables to LOCI variables that loci_api expects
    if (process.env.JORDAN_API_TOKEN) {
      process.env.LOCI_API_KEY = process.env.JORDAN_API_TOKEN;
    }
    if (process.env.JORDAN_BACKEND_URL) {
      process.env.LOCI_BACKEND_URL = process.env.JORDAN_BACKEND_URL;
    }

    const project = core.getInput("project", { required: true });
    const version = core.getInput("version", { required: true });

    core.startGroup(`Fetch function insights for ${project} (${version})`);
    await exec.exec("loci_api", ["func-insights", project, version]);
    core.info("Insights fetched successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

async function run() {
  try {
    const mode = core.getInput("mode", { required: true });
    
    // Setup Python environment first
    await setupPython();
    
    // Run the appropriate mode
    if (mode === "upload") {
      await uploadMode();
    } else if (mode === "insights") {
      await insightsMode();
    } else {
      core.setFailed(`Unknown mode: ${mode}. Must be 'upload' or 'insights'.`);
    }
  } catch (err) {
    core.setFailed(`Action failed: ${err.message}`);
  }
}

run();