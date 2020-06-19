import { GitProcess, IGitResult } from '../lib'

// NOTE: bump these versions to the latest stable releases
export const gitVersion = '2.23.'
export const gitLfsVersion = '2.7.2'

const temp = require('temp').track()

export async function initialize(repositoryName: string): Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  await GitProcess.exec(['init'], testRepoPath)
  await GitProcess.exec(['config', 'user.email', '"some.user@email.com"'], testRepoPath)
  await GitProcess.exec(['config', 'user.name', '"Some User"'], testRepoPath)
  return testRepoPath
}

/**
 * Initialize a repository with a remote pointing to a local bare repository.
 * If the remotePath is not specified, the remote repository will get automatically created.
 *
 * @param repositoryName
 * @param remotePath
 */
export async function initializeWithRemote(
  repositoryName: string,
  remotePath: string | null
): Promise<{ path: string; remote: string }> {
  if (remotePath === null) {
    const path = temp.mkdirSync(`desktop-git-test-remote-${repositoryName}`)
    await GitProcess.exec(['init', '--bare'], path)
    remotePath = path
  }

  if (remotePath === null) {
    throw new Error('for TypeScript')
  }

  const testRepoPath = await initialize(repositoryName)
  await GitProcess.exec(['remote', 'add', 'origin', remotePath], testRepoPath)

  return { path: testRepoPath, remote: remotePath }
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
