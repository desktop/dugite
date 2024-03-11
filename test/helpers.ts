import { GitProcess, IGitResult, GitError } from '../lib'

// NOTE: bump these versions to the latest stable releases
export const gitVersion = '2.43.3'
export const gitForWindowsVersion = '2.43.0.windows.1'
export const gitLfsVersion = '3.5.1'

const temp = require('temp').track()

export async function initialize(
  repositoryName: string,
  defaultBranch?: string
): Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  const branchArgs = defaultBranch !== undefined ? ['-b', defaultBranch] : []
  await GitProcess.exec(['init', ...branchArgs], testRepoPath)
  await GitProcess.exec(
    ['config', 'user.email', '"some.user@email.com"'],
    testRepoPath
  )
  await GitProcess.exec(['config', 'user.name', '"Some User"'], testRepoPath)
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

export function verify(
  result: IGitResult,
  callback: (result: IGitResult) => void
) {
  try {
    callback(result)
  } catch (e) {
    console.log(
      'error encountered while verifying; poking at response from Git:'
    )
    console.log(` - exitCode: ${result.exitCode}`)
    console.log(` - stdout: ${result.stdout.trim()}`)
    console.log(` - stderr: ${result.stderr.trim()}`)
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

expect.extend({
  toHaveGitError(result: IGitResult, expectedError: GitError) {
    let gitError = GitProcess.parseError(result.stderr)
    if (gitError === null) {
      gitError = GitProcess.parseError(result.stdout)
    }

    const message = () => {
      return [
        this.utils.matcherHint(
          `${this.isNot ? '.not' : ''}.toHaveGitError`,
          'result',
          'gitError'
        ),
        '',
        'Expected',
        `  ${this.utils.printExpected(getFriendlyGitError(expectedError))}`,
        'Received:',
        `  ${this.utils.printReceived(
          gitError ? getFriendlyGitError(gitError) : null
        )}`,
      ].join('\n')
    }

    if (gitError === expectedError) {
      return {
        pass: true,
        message,
      }
    }

    return {
      pass: false,
      message,
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R = IGitResult> {
      toHaveGitError(result: GitError): CustomMatcherResult
    }
  }
}
