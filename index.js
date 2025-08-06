const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function uploadMode() {
  try {
    const iProject = core.getInput("project", { required: true });
    const iVersion = core.getInput("version", { required: true });
    const iBinaries = core.getInput("binaries", { required: true });
    const apiToken = core.getInput("api-token", { required: true });
    const backendUrl = core.getInput("backend-url", { required: false }) || "https://api.daily.loci-dev.net/";

    // Set the API token and backend URL as environment variables
    process.env.JORDAN_API_TOKEN = apiToken;
    process.env.JORDAN_BACKEND_URL = backendUrl;

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

    core.startGroup("Upload simulation");
    core.info(`Would upload to: ${backendUrl}`);
    core.info(`Project: ${iProject}`);
    core.info(`Version: ${iVersion}`);
    core.info(`Archive size: ${binsArchive}`);
    core.info("Upload simulation completed successfully");
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

    // Set the API token and backend URL as environment variables
    process.env.JORDAN_API_TOKEN = apiToken;
    process.env.JORDAN_BACKEND_URL = backendUrl;

    core.startGroup(`Fetch function insights for ${project} (${version})`);
    core.info(`Would fetch insights from: ${backendUrl}`);
    core.info(`Project: ${project}`);
    core.info(`Version: ${version}`);
    core.info("Insights simulation completed successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

async function run() {
  try {
    const mode = core.getInput("mode", { required: true });

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