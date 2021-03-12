import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as setupPython from "setup-python/src/find-python";
import * as os from "os";
import { exec as execChild } from "child_process";

const INSTALL_VERSION = "3.8";

async function run() {
  const arch = core.getInput("architecture") || os.arch();
  const pdmVersion = core.getInput("version");
  const pdmPackage = pdmVersion ? `pdm==${pdmVersion}` : "pdm";
  try {
    await setupPython.findPythonVersion(INSTALL_VERSION, arch);
    await exec.exec("python", ["-m", "pip", "install", "-U", pdmPackage]);
    const installed = await setupPython.findPythonVersion(
      core.getInput("python-version"),
      arch
    );
    await exec.exec("pdm", ["use", "-f", installed.version]);
    const pdmVersionOutput = (await execChild("pdm --version")).stdout;
    core.info(
      `Successfully setup ${pdmVersionOutput} with Python ${installed.version}`
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
