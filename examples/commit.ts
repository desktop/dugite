import { GitProcess, GitError, IGitExecutionOptions } from '../lib/'

// for readability, let's alias this
const git = GitProcess.exec

export async function isUnbornRepository(path: string): Promise<boolean> {
  const result = await git(['rev-parse', '--verify', 'HEAD^{commit}'], path)
  if (result.exitCode === 0) {
    return true
  } else {
    // we might have 128 here, or some other status code
    // but whatever
    return false
  }
}

export async function createCommit(path: string, message: string) {
  if (await isUnbornRepository(path)) {
    // for an unborn repository we don't have access to HEAD
    // so a simple `git reset` here is fine
    await git(['reset'], path)
  } else {
    await git(['reset', 'HEAD', '--mixed'], path)
  }

  // ensure that untracked files are also staged
  await git(['add', '.'], path)
  await git(['add', '-u', '.'], path)

  const result = await git(['commit', '-F', '-'], path, { stdin: message })
  if (result.exitCode !== 0) {
    const error = GitProcess.parseError(result.stderr)
    if (error) {
      console.log(`Got error code: ${error}`)
    } else {
      console.log(`Could not parse error: ${result.stderr}`)
    }
  }
}
