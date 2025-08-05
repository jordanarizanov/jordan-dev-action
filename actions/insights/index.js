const core = require("@actions/core");
const exec = require("@actions/exec");

async function run() {
  try {
    const project = core.getInput("project", { required: true });
    const version = core.getInput("version", { required: true });
    const apiToken = core.getInput("api-token", { required: true });

    // Set the API token as environment variable for the jordan_api command
process.env.jordan_API_TOKEN = apiToken;

    core.startGroup(`Fetch function insights for ${project} (${version})`)
    await exec.exec("jordan_api", ["func-insights", project, version]);
    core.info("Insights fetched successfully");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Insights fetch failed: ${err.message}`);
  }
}

run();
