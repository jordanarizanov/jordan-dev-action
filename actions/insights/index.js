const core = require("@actions/core");
const exec = require("@actions/exec");

async function run() {
  try {
    const project = core.getInput("project", { required: true });
    const version = core.getInput("version", { required: true });
    const apiToken = core.getInput("api-token", { required: true });
    const backendUrl = core.getInput("backend-url", { required: false }) || "https://api.daily.loci-dev.net/";

    // Set the API token and backend URL as environment variables for the jordan_api command
    process.env.jordan_API_TOKEN = apiToken;
    process.env.jordan_BACKEND_URL = backendUrl;

    core.startGroup(`Fetch function insights for ${project} (${version})`)
    await exec.exec("jordan_api", ["func-insights", project, version]);
    core.info("Insights fetched successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

run();
