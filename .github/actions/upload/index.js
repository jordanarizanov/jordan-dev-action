const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function getVersion() {
  try {
    const ref = process.env.GITHUB_REF || '';
    const commit = process.env.GITHUB_SHA?.substring(0, 7) || '';

    let branch, tag = '';    
    if (ref.startsWith('refs/heads/')) {
      branch = ref.replace('refs/heads/', '');
    } else if (ref.startsWith('refs/tags/')) {
      tag = ref.replace('refs/tags/', '');
    }
    return tag || `${branch}@${commit}`;
  } catch (error) {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
}

async function run() {
  try {
    const iBinaries = core.getInput("binaries", { required: true });
    const iProject  = core.getInput("project",  { required: true });
    const iVersion  = core.getInput("version",  { required: false }) || await getVersion();

    const binaries = iBinaries
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    core.setOutput('version', iVersion);
    core.startGroup("Collect binaries");
    binaries.forEach((file) => core.info(`- ${file}`));
    core.endGroup();

    core.startGroup("Archive binaries");
    const binsArchive = path.join(process.cwd(), "binaries.tar.gz");
    await exec.exec("tar", ["-zcf", binsArchive, ...binaries]);
    await exec.exec("ls", ["-lh", binsArchive]);
    core.info("Binaries archived");
    core.endGroup();

    core.startGroup(`Upload project "${iProject}" version "${iVersion}" to Loci`);
    await exec.exec("loci_api", ["upload", binsArchive, iProject, iVersion]);
    core.info("Project version uploaded");
    core.endGroup();
  } catch (err) {
    core.setFailed(`Upload failed: ${err.message}`);
  }
}

run();
