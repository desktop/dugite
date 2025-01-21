import assert from 'assert'
import { IGitResult, GitError, exec, parseError } from '../lib'
import { TestContext } from 'node:test'
import { mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// NOTE: bump these versions to the latest stable releases
export const gitVersion = '2.47.1'
export const gitForWindowsVersion = '2.47.1.windows.2'
export const gitLfsVersion = '3.6.1'
export const gitCredentialManagerVersion = '2.6.1'

export async function initialize(
  t: TestContext,
  repositoryName: string,
  defaultBranch?: string
): Promise<string> {
  const prefix = `desktop-git-test-${repositoryName}`
  const testRepoPath = await createTestDir(t, prefix)
  const branchArgs = defaultBranch !== undefined ? ['-b', defaultBranch] : []
  await exec(['init', ...branchArgs], testRepoPath)
  await exec(['config', 'user.email', '"some.user@email.com"'], testRepoPath)
  await exec(['config', 'user.name', '"Some User"'], testRepoPath)
  return testRepoPath
}

/**
 * Initialize a repository with a remote pointing to a local bare repository.
 * If the remotePath is not specified, the remote repository will get automatically created.
 *
 * @param repositoryName    The name of the repository to create
 * @param remotePath        The path of the remote reposiry (when null a new repository will get created)
 */
export async function initializeWithRemote(
  t: TestContext,
  repositoryName: string,
  remotePath: string | null
): Promise<{ path: string; remote: string }> {
  if (remotePath === null) {
    const path = await createTestDir(
      t,
      `desktop-git-test-remote-${repositoryName}`
    )
    await exec(['init', '--bare'], path)
    remotePath = path
  }

  if (remotePath === null) {
    throw new Error('for TypeScript')
  }

  const testRepoPath = await initialize(t, repositoryName)
  await exec(['remote', 'add', 'origin', remotePath], testRepoPath)

  return { path: testRepoPath, remote: remotePath }
}

export function verify<T extends IGitResult>(
  result: T,
  callback: (result: T) => void
) {
  try {
    callback(result)
  } catch (e) {
    console.log(
      'error encountered while verifying; poking at response from Git:'
    )
    console.log(` - exitCode: ${result.exitCode}`)
    console.log(` - stdout: ${result.stdout}`)
    console.log(` - stderr: ${result.stderr}`)
    console.log()
    throw e
  }
}

/**
 * Reverse maps the provided GitError to print a friendly name for debugging tests.
 *
 * @param gitError GitError
 */
function getFriendlyGitError(gitError: GitError): string {
  const found = Object.entries(GitError).find(([key, value]) => {
    return value === gitError
  })

  if (found === undefined) {
    return gitError.toString()
  }

  return found[0]
}

export const assertHasGitError = (
  result: IGitResult,
  expectedError: GitError
) => {
  const gitError =
    parseError(result.stderr.toString()) ?? parseError(result.stdout.toString())

  assert.equal(
    gitError,
    expectedError,
    `Expected error ${getFriendlyGitError(expectedError)}, got ${
      gitError ? getFriendlyGitError(gitError) : 'none'
    }`
  )
}

export const createTestDir = async (t: TestContext, prefix: string) => {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}
