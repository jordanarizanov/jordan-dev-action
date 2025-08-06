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
    try {
      await exec.exec("pip", ["install", "--cache-dir", `${process.env.HOME}/.cache/pip`, "-r", requirementsFile]);
      core.info("Python dependencies installed");
    } catch (pipError) {
      core.warning("Could not install jordan_api via pip. This is expected if jordan_api is a binary tool.");
      core.info("Continuing with setup...");
    }
    core.endGroup();

    core.startGroup("Check jordan_api availability");
    try {
      await exec.exec("which", ["jordan_api"]);
      core.info("jordan_api command found in PATH");
    } catch (whichError) {
      core.warning("jordan_api command not found in PATH");
      core.info("Please ensure jordan_api is installed and available in the system PATH");
      core.info("You may need to install it manually or provide installation instructions");
    }
    core.endGroup();

    core.info("Python environment ready");
  } catch (err) {
    core.setFailed(`Failed in setup: ${err.message}`);
  }
}

async function uploadMode() {
  try {
    const iProject = core.getInput("project", { required: true });
    const iVersion = core.getInput("version", { required: true });
    const iBinaries = core.getInput("binaries", { required: true });
    const apiToken = core.getInput("api-token", { required: true });
    const backendUrl = core.getInput("backend-url", { required: false }) || "https://api.daily.loci-dev.net/";

    // Set the API token and backend URL as environment variables for the jordan_api command
    process.env.jordan_API_TOKEN = apiToken;
    process.env.jordan_BACKEND_URL = backendUrl;

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

    core.startGroup("Upload new project version to jordan");
    await exec.exec("jordan_api", ["upload", binsArchive, iProject, iVersion]);
    core.info("Project version uploaded");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Upload failed: ${err.message}`);
  }
}

async function insightsMode() {
  try {
    const project = core.getInput("project", { required: true });
    const version = core.getInput("version", { required: true });
    const apiToken = core.getInput("api-token", { required: true });
    const backendUrl = core.getInput("backend-url", { required: false }) || "https://api.daily.loci-dev.net/";

    // Set the API token and backend URL as environment variables for the jordan_api command
    process.env.jordan_API_TOKEN = apiToken;
    process.env.jordan_BACKEND_URL = backendUrl;

    core.startGroup(`Fetch function insights for ${project} (${version})`);
    await exec.exec("jordan_api", ["func-insights", project, version]);
    core.info("Insights fetched successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

async function run() {
  try {
    const mode = core.getInput("mode", { required: true });

    // Setup Python environment
    await setupPython();

    // Run based on mode
    if (mode === "upload") {
      await uploadMode();
    } else if (mode === "insights") {
      await insightsMode();
    } else {
      core.setFailed(`Invalid mode: ${mode}. Must be 'upload' or 'insights'`);
    }
  } catch (err) {
    core.setFailed(`Action failed: ${err.message}`);
  }
}

run(); 