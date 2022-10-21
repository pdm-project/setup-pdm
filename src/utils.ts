import * as core from '@actions/core';
import got from 'got';
import { promises as fs } from 'fs';
import { useCpythonVersion } from 'setup-python/src/find-python';
import { findPyPyVersion } from 'setup-python/src/find-pypy';


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


export async function findPythonVersion(version: string, architecture: string): Promise<string> {
  let pythonVersion = '';
  if (isPyPyVersion(version)) {
    const installed = await findPyPyVersion(
      version,
      architecture,
      true,
      false
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
      false
    );
    pythonVersion = installed.version;
    core.info(`Successfully set up ${installed.impl} (${pythonVersion})`);
    return installed.version;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf8');
}

