import path from 'node:path'
import process from 'node:process'
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import { hashFiles } from '@actions/glob'
import { getOutput } from './utils'

async function calculateCacheKeys(pythonVersion: string, cacheDependencyPath: string): Promise<{ primaryKey: string, restoreKeys: string[] }> {
  const hash = await hashFiles(cacheDependencyPath)
  const primaryKey = `setup-pdm-${process.env.RUNNER_OS}-${process.env.RUNNER_ARCH}-python-${pythonVersion}-${hash}`
  const restoreKey = `setup-pdm-${process.env.RUNNER_OS}-${process.env.RUNNER_ARCH}-python-${pythonVersion}-`
  return { primaryKey, restoreKeys: [restoreKey] }
}

async function cacheDependencies(pdmBin: string, pythonVersion: string) {
  const cacheDependencyPath = core.getInput('cache-dependency-path') || 'pdm.lock'
  const { primaryKey, restoreKeys } = await calculateCacheKeys(pythonVersion, cacheDependencyPath)
  if (primaryKey.endsWith('-')) {
    throw new Error(
      `No file in ${process.cwd()} matched to [${cacheDependencyPath
        .split('\n')
        .join(',')}], make sure you have checked out the target repository`,
    )
  }

  const cachePath = await getCacheDirectories(pdmBin)

  core.saveState('cache-paths', cachePath)
  core.saveState('cache-primary-key', primaryKey)

  const matchedKey = await cache.restoreCache(cachePath, primaryKey, restoreKeys)

  handleMatchResult(matchedKey, primaryKey)
}

async function getCacheDirectories(pdmBin: string): Promise<string[]> {
  const paths = [
    path.join(process.cwd(), '.venv'),
    path.join(process.cwd(), '__pypackages__'),
  ]
  paths.push(await getOutput(pdmBin, ['config', 'cache_dir']))
  paths.push(await getOutput(pdmBin, ['config', 'venv.location']))
  return paths
}

function handleMatchResult(matchedKey: string | undefined, primaryKey: string) {
  if (matchedKey) {
    core.saveState('cache-matched-key', matchedKey)
    core.info(`Cache restored from key: ${matchedKey}`)
  }
  else {
    core.info(`pdm cache is not found`)
  }
  core.setOutput('cache-hit', matchedKey === primaryKey)
}

export { cacheDependencies }
