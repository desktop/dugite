import * as path from 'path'

import {
  parseError,
  GitError,
  GitErrorRegexes,
  RepositoryDoesNotExistErrorCode
} from '../../lib/errors'
import { GitProcess } from '../../lib'

const temp = require('temp').track()

describe('errors', () => {
  it('each error code should have its corresponding regexp', () => {
    const difference = (left: GitError[], right: GitError[]) =>
      left.filter(item => right.indexOf(item) === -1)

    const errorCodes = new Array<GitError>()

    for (const key in GitError) {
      errorCodes.push(GitError[key] as GitError)
    }

    const regexes = [...GitErrorRegexes.values()]

    const errorCodesWithoutRegex = difference(errorCodes, regexes)
    const regexWithoutErrorCodes = difference(regexes, errorCodes)

    expect(errorCodesWithoutRegex).toHaveLength(0)
    expect(regexWithoutErrorCodes).toHaveLength(0)
  })

  it('raises error when folder does not exist', async () => {
    const testRepoPath = path.join(temp.path(), 'desktop-does-not-exist')

    let error: Error | null = null
    try {
      await GitProcess.exec(['show', 'HEAD'], testRepoPath)
    } catch (e) {
      error = e
    }

    expect(error!.message).toBe('Unable to find path to repository on disk.')
    expect((error as any).code).toBe(RepositoryDoesNotExistErrorCode)
  })

  it('can parse errors', () => {
    const error = parseError('fatal: Authentication failed')
    expect(error).toBe(GitError.SSHAuthenticationFailed)
  })

  it('can parse bad revision errors', () => {
    const error = parseError("fatal: bad revision 'beta..origin/beta'")
    expect(error).toBe(GitError.BadRevision)
  })

  it('can parse unrelated histories error', () => {
    const stderr = `fatal: refusing to merge unrelated histories`

    const error = parseError(stderr)
    expect(error).toBe(GitError.CannotMergeUnrelatedHistories)
  })

  it('can parse GH001 push file size error', () => {
    const stderr = `remote: error: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
remote: error: Trace: 2bd2bfca1605d4e0847936332f1b6c07
remote: error: See http://git.io/iEPt8g for more information.
remote: error: File some-file.mp4 is 292.85 MB; this exceeds GitHub's file size limit of 100.00 MB
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] master -> master (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

    expect(parseError(stderr)).toBe(GitError.PushWithFileSizeExceedingLimit)
  })

  it('can parse GH002 branch name error', () => {
    const stderr = `remote: error: GH002: Sorry, branch or tag names consisting of 40 hex characters are not allowed.
remote: error: Invalid branch or tag name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa -> aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

    expect(parseError(stderr)).toBe(GitError.HexBranchNameRejected)
  })

  it('can parse GH003 force push error', () => {
    const stderr = `remote: error: GH003: Sorry, force-pushing to my-cool-branch is not allowed.
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected]  my-cool-branch ->  my-cool-branch (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

    expect(parseError(stderr)).toBe(GitError.ForcePushRejected)
  })

  it('can parse GH005 ref length error', () => {
    const stderr = `remote: error: GH005: Sorry, refs longer than 255 bytes are not allowed.
To https://github.com/shiftkey/too-large-repository.git
...`
    // there's probably some output here missing but I couldn't trigger this locally
    expect(parseError(stderr)).toBe(GitError.InvalidRefLength)
  })

  it('can parse GH006 protected branch push error', () => {
    const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: At least one approved review is required
To https://github.com/shiftkey-tester/protected-branches.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey-tester/protected-branches.git'`

    expect(parseError(stderr)).toBe(GitError.ProtectedBranchRequiresReview)
  })

  it('can parse GH006 protected branch force push error', () => {
    const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Cannot force-push to a protected branch
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

    expect(parseError(stderr)).toBe(GitError.ProtectedBranchForcePush)
  })

  it('can parse GH006 protected branch delete error', () => {
    const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/dupe.
remote: error: Cannot delete a protected branch
To https://github.com/tierninho-tester/trterdgdfgdf.git
  ! [remote rejected] dupe (protected branch hook declined)
error: failed to push some refs to 'https://github.com/tierninho-tester/trterdgdfgdf.git'`

    expect(parseError(stderr)).toBe(GitError.ProtectedBranchDeleteRejected)
  })

  it('can parse GH006 required status check error', () => {
    const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Required status check "continuous-integration/travis-ci" is expected.
To https://github.com/Raul6469/EclipseMaven.git
  ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/Raul6469/EclipseMaven.git`

    expect(parseError(stderr)).toBe(GitError.ProtectedBranchRequiredStatus)
  })

  it('can parse GH007 push with private email error', () => {
    const stderr = `remote: error: GH007: Your push would publish a private email address.
remote: You can make your email public or disable this protection by visiting:
remote: http://github.com/settings/emails`

    expect(parseError(stderr)).toBe(GitError.PushWithPrivateEmail)
  })

  it('can parse LFS attribute does not match error', () => {
    const stderr = `The filter.lfs.clean attribute should be "git-lfs clean -- %f" but is "git lfs clean %f"`
    expect(parseError(stderr)).toBe(GitError.LFSAttributeDoesNotMatch)
  })

  it('can parse rename Branch error', () => {
    const stderr = `error: refname refs/heads/adding-renamefailed-error not found
      fatal: Branch rename failed`
    expect(parseError(stderr)).toBe(GitError.BranchRenameFailed)
  })

  it('can parse path does not exist error - neither on disk nor in the index', () => {
    const stderr = "fatal: Path 'missing.txt' does not exist (neither on disk nor in the index).\n"
    expect(parseError(stderr)).toBe(GitError.PathDoesNotExist)
  })

  it('can parse path does not exist error - in commitish', () => {
    const stderr = "fatal: Path 'missing.txt' does not exist in 'HEAD'\n"
    expect(parseError(stderr)).toBe(GitError.PathDoesNotExist)
  })

  it('can parse invalid object name error', () => {
    const stderr = "fatal: Invalid object name 'HEAD'.\n"
    expect(parseError(stderr)).toBe(GitError.InvalidObjectName)
  })

  it('can parse revert failed error', () => {
    const stderr = `error: Reverting is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'git add/rm <file>',
as appropriate, to mark resolution and make a commit.
fatal: revert failed`
    expect(parseError(stderr)).toBe(GitError.RevertConflicts)
  })

  it('can parse repository not found error', () => {
    const stderr = `fatal: repository 'gsgdgsgdsgsgsgdsgds' does not exist`
    expect(parseError(stderr)).toBe(GitError.HTTPSRepositoryNotFound)
  })

  it('can parse is outside repository error', () => {
    const stderr = "fatal: /missing.txt: '/missing.txt' is outside repository\n"
    expect(parseError(stderr)).toBe(GitError.OutsideRepository)
  })

  it('can parse lock file exists error', () => {
    const stderr = `Unable to create  'path_to_repo/.git/index.lock: File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.`
    expect(parseError(stderr)).toBe(GitError.LockFileAlreadyExists)
  })

  it('can parse the previous not found repository error', () => {
    const stderr = 'fatal: Not a git repository (or any of the parent directories): .git'
    expect(parseError(stderr)).toBe(GitError.NotAGitRepository)
  })

  it('can parse the current found repository error', () => {
    const stderr = 'fatal: not a git repository (or any of the parent directories): .git'
    expect(parseError(stderr)).toBe(GitError.NotAGitRepository)
  })

  it('can parse the no merge to abort error', () => {
    const stderr = 'fatal: There is no merge to abort (MERGE_HEAD missing).\n'
    expect(parseError(stderr)).toBe(GitError.NoMergeToAbort)
  })
})
