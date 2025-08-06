const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function setupPython() {
  try {
    const fs = require('fs');
    
    core.startGroup("Setup python environment");
    await exec.exec("python", ["--version"]);
    core.endGroup();

    core.startGroup("Upgrade pip");
    await exec.exec("python", ["-m", "pip", "install", "--upgrade", "pip"]);
    core.endGroup();

    core.startGroup("Install python dependencies");
    // Create requirements.txt with loci_api
    const requirementsContent = "loci_api\n";
    fs.writeFileSync("requirements.txt", requirementsContent);
    core.info("Created requirements.txt with loci_api");
    
    await exec.exec("pip", ["install", "--cache-dir", `${process.env.HOME}/.cache/pip`, "-r", "requirements.txt"]);
    core.info("Python dependencies installed");
    
    // Verify loci_api is available
    await exec.exec("which", ["loci_api"]);
    core.info("loci_api found in PATH");
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
    const iVersion  = core.getInput("version", { required: false }) || process.env.JORDAN_VERSION;
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
    const version = core.getInput("version", { required: false }) || process.env.JORDAN_VERSION;

    core.startGroup(`Fetch function insights for ${project} (${version})`);
    await exec.exec("loci_api", ["func-insights", project, version]);
    core.info("Insights fetched successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

async function getVersionInfo() {
  try {
    // Get git commit hash
    let gitHash = '';
    await exec.exec('git', ['rev-parse', '--short', 'HEAD'], {
      listeners: {
        stdout: (data) => {
          gitHash = data.toString().trim();
        }
      }
    });

    // Get git tag if available
    let gitTag = '';
    try {
      await exec.exec('git', ['describe', '--tags', '--exact-match', 'HEAD'], {
        listeners: {
          stdout: (data) => {
            gitTag = data.toString().trim();
          }
        }
      });
    } catch {
      // No exact tag match, that's okay
    }

    // Get branch name
    let gitBranch = '';
    await exec.exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      listeners: {
        stdout: (data) => {
          gitBranch = data.toString().trim();
        }
      }
    });

    // Create version string
    let version = gitTag || `${gitBranch}-${gitHash}`;
    
    core.info(`Generated version: ${version} (from jordan action git info)`);
    return version;
  } catch (err) {
    // Fallback to timestamp if git fails
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    core.info(`Git version failed, using timestamp: jordan-${timestamp}`);
    return `jordan-${timestamp}`;
  }
}

async function run() {
  try {
    const mode = core.getInput("mode", { required: true });
    let inputVersion = core.getInput("version", { required: false });
    
    // If no version provided, generate from git
    if (!inputVersion) {
      inputVersion = await getVersionInfo();
      core.info(`Auto-generated version: ${inputVersion}`);
    }
    
    // Set the version for use in upload/insights modes
    core.exportVariable('JORDAN_VERSION', inputVersion);
    
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