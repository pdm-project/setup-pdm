import * as core from '@actions/core';
import { useCpythonVersion } from 'setup-python/src/find-python';
import { findPyPyVersion } from 'setup-python/src/find-pypy';


function isPyPyVersion(versionSpec: string) {
  return versionSpec.startsWith('pypy');
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
