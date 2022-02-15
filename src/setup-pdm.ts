import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as setupPython from "setup-python/src/find-python";
import { IS_WINDOWS } from "setup-python/src/utils";
import * as os from "os";
import { exec as execChild } from "child_process";
import path from "path";

const INSTALL_VERSION = "3.8";
const GITHUB_REPO = "https://github.com/pdm-project/pdm.git";

function getPep582Path(): string {
  const installDir = process.env.pythonLocation || "";
  if (IS_WINDOWS) {
    return path.resolve(installDir, "Lib/site-packages/pdm/pep582");
  } else {
    return path.resolve(
      installDir,
      "lib",
      `python${INSTALL_VERSION}`,
      "site-packages/pdm/pep582"
    );
  }
}

async function run(): Promise<void> {
  const arch = core.getInput("architecture") || os.arch();
  const pdmVersion = core.getInput("version");
  const ref = core.getInput("ref");
  const pdmPackage = pdmVersion
    ? `pdm==${pdmVersion}`
    : ref
    ? `pdm @ git+${GITHUB_REPO}@${ref}`
    : "pdm";
  const cmdArgs = ["-m", "pip", "install", "-U", pdmPackage];
  if (core.getInput("prerelease") === "true") {
    cmdArgs.push("--pre");
  }
  try {
    let installedPython = await setupPython.findPythonVersion(
      INSTALL_VERSION,
      arch
    );
    await exec.exec("python", cmdArgs);
    if (core.getInput("enable-pep582") === "true") {
      core.exportVariable("PYTHONPATH", getPep582Path());
    }
    if (core.getInput("python-version") !== INSTALL_VERSION) {
      installedPython = await setupPython.findPythonVersion(
        core.getInput("python-version"),
        arch
      );
    }
    const pythonBin = path.join(
      process.env.pythonLocation as string,
      IS_WINDOWS ? "python.exe" : "bin/python"
    );
    await exec.exec("pdm", ["config", "-l", "python.path", pythonBin]);
    const pdmVersionOutput = (await execChild("pdm --version")).stdout;
    if (process.platform === "linux") {
      // See https://github.com/actions/virtual-environments/issues/2803
      core.exportVariable("LD_PRELOAD", "/lib/x86_64-linux-gnu/libgcc_s.so.1");
    }
    core.info(
      `Successfully setup ${
        pdmVersionOutput && pdmVersionOutput.read()
      } with Python ${installedPython.version}`
    );
    const matchersPath = path.join(__dirname, "..", ".github");
    core.info(`##[add-matcher]${path.join(matchersPath, "python.json")}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
