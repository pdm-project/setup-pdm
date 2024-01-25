import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import got from 'got'
import { useCpythonVersion } from 'setup-python/src/find-python'
import { findPyPyVersion } from 'setup-python/src/find-pypy'
import {
  getVersionInputFromFile,
  getVersionInputFromTomlFile,
  logWarning,
} from 'setup-python/src/utils'
import { getExecOutput } from '@actions/exec'

function isPyPyVersion(versionSpec: string): boolean {
  return versionSpec.startsWith('pypy')
}

export async function fetchUrlAsBuffer(url: string): Promise<Buffer> {
  const response = await got(url)
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}`)

  return Buffer.from(response.body)
}

export async function findPythonVersion(version: string, architecture: string, allowPreReleases: boolean, updateEnvironment: boolean = true): Promise<string> {
  let pythonVersion = ''
  if (isPyPyVersion(version)) {
    const installed = await findPyPyVersion(
      version,
      architecture,
      updateEnvironment,
      false,
      allowPreReleases,
    )
    pythonVersion = `${installed.resolvedPyPyVersion}-${installed.resolvedPythonVersion}`
    core.info(
      `Successfully set up PyPy ${installed.resolvedPyPyVersion} with Python (${installed.resolvedPythonVersion})`,
    )
    return `pypy-${installed.resolvedPythonVersion}`
  }
  else {
    const installed = await useCpythonVersion(
      version,
      architecture,
      updateEnvironment,
      false,
      allowPreReleases,
    )
    pythonVersion = installed.version
    core.info(`Successfully set up ${installed.impl} (${pythonVersion})`)
    return installed.version
  }
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.promises.readFile(filePath, 'utf8')
}

export async function getOutput(command: string, args: string[]): Promise<string> {
  const { stdout, exitCode, stderr } = await getExecOutput(command, args)
  if (exitCode && stderr)
    throw new Error(`Could not run ${command} ${args.join(' ')}: ${stderr}`)

  return stdout.trim()
}

export function isCacheAvailable(): boolean {
  if (!core.getBooleanInput('cache'))
    return false

  if (!cache.isFeatureAvailable()) {
    core.warning('Caching is not supported on this platform.')
    return false
  }

  return true
}

function resolveVersionInputFromDefaultFile(): string[] {
  const couples: [string, (versionFile: string) => string[]][] = [
    ['pyproject.toml', getVersionInputFromTomlFile],
  ]
  for (const [versionFile, _fn] of couples) {
    logWarning(
      `Neither 'python-version' nor 'python-version-file' inputs were supplied. Attempting to find '${versionFile}' file.`,
    )
    if (fs.existsSync(versionFile))
      return _fn(versionFile)
    else
      logWarning(`${versionFile} doesn't exist.`)
  }
  return []
}

export function resolveVersionInput() {
  let versions = core.getMultilineInput('python-version')
  const versionFile = core.getInput('python-version-file')

  if (versions.length) {
    if (versionFile) {
      core.warning(
        'Both python-version and python-version-file inputs are specified, only python-version will be used.',
      )
    }
  }
  else {
    if (versionFile) {
      if (!fs.existsSync(versionFile)) {
        throw new Error(
          `The specified python version file at: ${versionFile} doesn't exist.`,
        )
      }
      versions = getVersionInputFromFile(versionFile)
    }
    else {
      versions = resolveVersionInputFromDefaultFile()
    }
  }

  return versions
}
