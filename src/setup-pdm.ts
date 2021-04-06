import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as setupPython from "setup-python/src/find-python";
import * as os from "os";
import { exec as execChild } from "child_process";
import path from "path";

const INSTALL_VERSION = "3.8";

async function run() {
  const arch = core.getInput("architecture") || os.arch();
  const pdmVersion = core.getInput("version");
  const pdmPackage = pdmVersion ? `pdm==${pdmVersion}` : "pdm";
  const cmdArgs = ["-m", "pip", "install", "-U", pdmPackage];
  if (core.getInput("prerelease") === 'true') {
    cmdArgs.push("--pre");
  }
  try {
    await setupPython.findPythonVersion(INSTALL_VERSION, arch);
    await exec.exec("python", cmdArgs);
    const installed = await setupPython.findPythonVersion(
      core.getInput("python-version"),
      arch
    );
    await exec.exec("pdm", ["use", "-f", installed.version]);
    const pdmVersionOutput = (await execChild("pdm --version")).stdout;
    if (process.platform === 'linux') {
      // See https://github.com/actions/virtual-environments/issues/2803
      core.exportVariable('LD_PRELOAD', '/lib/x86_64-linux-gnu/libgcc_s.so.1');
    }
    core.info(
      `Successfully setup ${pdmVersionOutput} with Python ${installed.version}`
    );
    const matchersPath = path.join(__dirname, '..', '.github');
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
