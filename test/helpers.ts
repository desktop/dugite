import { GitProcess, IGitResult } from '../lib'

// NOTE: bump these versions to the latest stable releases
export const gitVersion = '2.14.1'
export const gitLfsVersion = '2.2.1'

const temp = require('temp').track()

export async function initialize(repositoryName: string): Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  await GitProcess.exec([ 'init' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.email', '"some.user@email.com"' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.name', '"Some User"' ], testRepoPath)
  return testRepoPath
}

export function verify(result: IGitResult, callback: (result: IGitResult) => void) {
  try {
    callback(result)
  } catch (e) {
    console.log('error encountered while verifying; poking at response from Git:')
    console.log(` - exitCode: ${result.exitCode}`)
    console.log(` - stdout: ${result.stdout.trim()}`)
    console.log(` - stderr: ${result.stderr.trim()}`)
    console.log()
    throw e
  }
}

/**
 * Returns with the container directory for the Git executable.
 * This function could come handy, when trying to set the `LOCAL_GIT_DIRECTORY` environment variable
 * for `dugite`. Passing into the exact path of the Git executable will return with the local Git directory
 * path that is expected by `dugite`.
 *
 * @param gitPath the FS path to the Git executable.
 */
export function getGitDirPath(gitPath: string): string {
    const segments = gitPath.split(/(\/|\\)/)
    const parts = !segments[0].length ? segments.slice(1) : segments
    return parts.slice(0, parts.length - 4).join('')
}
