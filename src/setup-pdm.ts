import * as os from 'os';
import path from 'path';
import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { IS_WINDOWS } from 'setup-python/src/utils';
import semParse from 'semver/functions/parse';
import * as utils from './utils';
import { cacheDependencies } from './caches';

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/pdm-project/pdm/main/install-pdm.py';
interface InstallOutput {
  pdm_version: string;
  pdm_bin: string;
  install_python_version: string;
  install_location: string;
}

function getPep582Path(installDir: string, pythonVersion: string): string {
  const parsedVersion = semParse(pythonVersion)!;
  if (IS_WINDOWS) {
    return path.resolve(installDir, 'Lib/site-packages/pdm/pep582');
  } else {
    return path.resolve(installDir, 'lib', `python${parsedVersion.major}.${parsedVersion.minor}`, 'site-packages/pdm/pep582');
  }
}

async function run(): Promise<void> {
  const arch = core.getInput('architecture') || os.arch();
  const pdmVersion = core.getInput('version');
  const pythonVersion = core.getInput('python-version');
  const cmdArgs = ['-'];
  if (core.getBooleanInput('prerelease')) {
    cmdArgs.push('--prerelease');
  }
  if (pdmVersion) {
    cmdArgs.push('--version', pdmVersion);
  }
  cmdArgs.push('-o', 'install-output.json');
  // Use the default python version installed with the runner
  try {
    await exec(IS_WINDOWS ? 'python' : 'python3', cmdArgs, { input: await utils.fetchUrlAsBuffer(INSTALL_SCRIPT_URL) });
    const installOutput: InstallOutput = JSON.parse(await utils.readFile('install-output.json'));
    core.debug(`Install output: ${installOutput}`);
    core.setOutput('pdm-version', installOutput.pdm_version);
    core.setOutput('pdm-bin', path.join(installOutput.install_location, installOutput.pdm_bin));
    core.addPath(path.dirname(installOutput.pdm_bin));
    if (core.getBooleanInput('enable-pep582')) {
      core.exportVariable('PYTHONPATH', getPep582Path(installOutput.install_location, installOutput.install_python_version));
    }

    const installedPython = await utils.findPythonVersion(pythonVersion, arch);

    if (process.platform === 'linux') {
      // See https://github.com/actions/virtual-environments/issues/2803
      core.exportVariable('LD_PRELOAD', '/lib/x86_64-linux-gnu/libgcc_s.so.1');
    }
    core.info(`Successfully setup ${installOutput.pdm_version} with Python ${installedPython}`);
    const matchersPath = path.join(__dirname, '..', '.github');
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`);
    if (utils.isCacheAvailable()) {
      await cacheDependencies(installOutput.pdm_bin, installedPython);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
