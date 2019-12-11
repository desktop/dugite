import { GitProcess, IGitResult } from '../lib'

// NOTE: bump these versions to the latest stable releases
// We're currently using 2.19. instead of 2.19.3 because we're
// shipping 2.19.3 on macOS/Linux and 2.19.2.windows.4 on Windows.
// This is a temporary state and we should revert to specifying the
// patch on the next git version bump.
export const gitVersion = '2.19.'
export const gitLfsVersion = '2.6.0'

const temp = require('temp').track()

export async function initialize(repositoryName: string): Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  await GitProcess.exec(['init'], testRepoPath)
  await GitProcess.exec(['config', 'user.email', '"some.user@email.com"'], testRepoPath)
  await GitProcess.exec(['config', 'user.name', '"Some User"'], testRepoPath)
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
