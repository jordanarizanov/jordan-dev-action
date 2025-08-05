const core = require("@actions/core");
const exec = require("@actions/exec");

async function run() {
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
    core.setFailed(`Failed in common action: ${err.message}`);
  }
}

run();