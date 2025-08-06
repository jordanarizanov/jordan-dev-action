const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function run() {
  try {
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

    core.startGroup("Upload new project version to jordan");
    await exec.exec("jordan_api", ["upload", binsArchive, iProject, iVersion]);
    core.info("Project version uploaded");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Upload failed: ${err.message}`);
  }
}

run(); 