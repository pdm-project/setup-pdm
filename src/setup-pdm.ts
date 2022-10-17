import * as os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IS_WINDOWS } from 'setup-python/src/utils'
import semParse from 'semver/functions/parse'
import semIntersect from 'semver/ranges/intersects'
import { findPythonVersion } from './utils'

const PDM_PYTHON_REQUIRES = '>=3.7'
const FALLBACK_INSTALL_VERSION = '3.10'
const GITHUB_REPO = 'https://github.com/pdm-project/pdm.git'

function getPep582Path(version: string): string {
  const installDir = process.env.pythonLocation || ''
  const parsedVersion = semParse(version)!
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
  const versionCompatible = semIntersect(PDM_PYTHON_REQUIRES, pythonVersion)
  const ref = core.getInput('ref')
  const pdmPackage = pdmVersion ? `pdm==${pdmVersion}` : ref ? `pdm @ git+${GITHUB_REPO}@${ref}` : 'pdm'
  const cmdArgs = ['-m', 'pip', 'install', '-U', pdmPackage]
  if (core.getInput('prerelease') === 'true') {
    cmdArgs.push('--pre')
  }
  try {
    let installedPython = await findPythonVersion(versionCompatible ? pythonVersion : FALLBACK_INSTALL_VERSION, arch)
    await exec.exec('python', cmdArgs)
    if (core.getInput('enable-pep582') === 'true') {
      core.exportVariable('PYTHONPATH', getPep582Path(installedPython))
    }
    if (!versionCompatible) {
      installedPython = await findPythonVersion(pythonVersion, arch)
    }
    const pythonBin = path.join(process.env.pythonLocation as string, IS_WINDOWS ? 'python.exe' : 'bin/python').replace(/\\/g, '/')
    await fs.writeFile('.pdm.toml', `[python]\npath="${pythonBin}"\n`)
    const { stdout: pdmVersionOutput } = await exec.getExecOutput('pdm --version')
    if (process.platform === 'linux') {
      // See https://github.com/actions/virtual-environments/issues/2803
      core.exportVariable('LD_PRELOAD', '/lib/x86_64-linux-gnu/libgcc_s.so.1')
    }
    core.info(`Successfully setup ${pdmVersionOutput} with Python ${installedPython}`)
    const matchersPath = path.join(__dirname, '..', '.github')
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
