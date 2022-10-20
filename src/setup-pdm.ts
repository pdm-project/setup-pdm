import * as os from 'os'
import path from 'path'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IS_WINDOWS } from 'setup-python/src/utils'
import semParse from 'semver/functions/parse'
import * as utils from './utils'

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/pdm-project/pdm/main/install-pdm.py'
interface InstallOutput {
  pdm_version: string;
  pdm_bin: string;
  install_python_version: string;
  install_location: string;
}

function getPep582Path(installDir: string, pythonVersion: string): string {
  const parsedVersion = semParse(pythonVersion)!
  if (IS_WINDOWS) {
    return path.resolve(installDir, 'Lib/site-packages/pdm/pep582')
  } else {
    return path.resolve(installDir, 'lib', `python${parsedVersion.major}.${parsedVersion.minor}`, 'site-packages/pdm/pep582')
  }
}

async function run(): Promise<void> {
  const arch = core.getInput('architecture') || os.arch()
  const pdmVersion = core.getInput('version')
  const pythonVersion = core.getInput('python-version')
  const cmdArgs = []
  if (core.getInput('prerelease') === 'true') {
    cmdArgs.push('--prerelease')
  }
  if (pdmVersion) {
    cmdArgs.push('--version', pdmVersion)
  }
  if (cmdArgs.length > 0) {
    cmdArgs.splice(0, 0, '-')
  }
  // Use the default python version installed with the runner
  try {
    await exec.exec('python', cmdArgs, { input: await utils.fetchUrlAsBuffer(INSTALL_SCRIPT_URL) })
    const installOutput = JSON.parse(process.env.PDM_INSTALL_OUTPUT!) as InstallOutput
    core.debug(`install output: ${process.env.PDM_INSTALL_SCRIPT_OUTPUT}`)
    core.setOutput('pdm-version', installOutput.pdm_version)
    core.setOutput('pdm-bin', path.join(installOutput.install_location, installOutput.pdm_bin))
    core.addPath(path.dirname(installOutput.pdm_bin))
    if (core.getInput('enable-pep582') === 'true') {
      core.exportVariable('PYTHONPATH', getPep582Path(installOutput.install_location, installOutput.install_python_version))
    }

    const installedPython = await utils.findPythonVersion(pythonVersion, arch)

    if (process.platform === 'linux') {
      // See https://github.com/actions/virtual-environments/issues/2803
      core.exportVariable('LD_PRELOAD', '/lib/x86_64-linux-gnu/libgcc_s.so.1')
    }
    core.info(`Successfully setup ${installOutput.pdm_version} with Python ${installedPython}`)
    const matchersPath = path.join(__dirname, '..', '.github')
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
