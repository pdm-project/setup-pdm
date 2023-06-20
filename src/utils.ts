import * as core from '@actions/core';
import * as cache from '@actions/cache';
import got from 'got';
import { promises as fs } from 'fs';
import { useCpythonVersion } from 'setup-python/src/find-python';
import { findPyPyVersion } from 'setup-python/src/find-pypy';
import { getExecOutput } from '@actions/exec';


function isPyPyVersion(versionSpec: string): boolean {
  return versionSpec.startsWith('pypy');
}

export async function fetchUrlAsBuffer(url: string): Promise<Buffer> {
  const response = await got(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return Buffer.from(response.body);
}


export async function findPythonVersion(version: string, architecture: string, prerelease: boolean): Promise<string> {
  let pythonVersion = '';
  if (isPyPyVersion(version)) {
    const installed = await findPyPyVersion(
      version,
      architecture,
      true,
      false,
      prerelease
    );
    pythonVersion = `${installed.resolvedPyPyVersion}-${installed.resolvedPythonVersion}`;
    core.info(
      `Successfully set up PyPy ${installed.resolvedPyPyVersion} with Python (${installed.resolvedPythonVersion})`
    );
    return installed.resolvedPythonVersion;
  } else {
    const installed = await useCpythonVersion(
      version,
      architecture,
      true,
      false,
      prerelease
    );
    pythonVersion = installed.version;
    core.info(`Successfully set up ${installed.impl} (${pythonVersion})`);
    return installed.version;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf8');
}

export async function getOutput(command: string, args: string[]): Promise<string> {
  const { stdout, exitCode, stderr } = await getExecOutput(command, args);
  if (exitCode && stderr) {
    throw new Error(`Could not run ${command} ${args.join(' ')}: ${stderr}`);
  }
  return stdout.trim();
}


export function isCacheAvailable(): boolean {
  if (!core.getBooleanInput('cache')) {
    return false;
  }
  if (!cache.isFeatureAvailable()) {
    core.warning('Caching is not supported on this platform.');
    return false;
  }

  return true;
}
