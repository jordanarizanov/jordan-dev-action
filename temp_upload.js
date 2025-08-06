const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function run() {
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

run(); 