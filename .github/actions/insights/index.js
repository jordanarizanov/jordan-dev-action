const core = require("@actions/core");
const exec = require("@actions/exec");

async function run() {
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

run(); 