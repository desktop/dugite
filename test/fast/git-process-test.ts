import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

import {
  GitProcess,
  GitError,
  RepositoryDoesNotExistErrorCode,
  GitTaskCancelResult,
} from '../../lib'
import { GitErrorRegexes } from '../../lib/errors'
import {
  initialize,
  verify,
  initializeWithRemote,
  gitForWindowsVersion,
} from '../helpers'

import { gitVersion } from '../helpers'
import { setupNoAuth } from '../slow/auth'

const temp = require('temp').track()

describe('git-process', () => {
  it('can cancel in-progress git command', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-clone-valid')
    const options = {
      env: setupNoAuth(),
    }
    const task = GitProcess.execTask(
      ['clone', '--', 'https://github.com/shiftkey/friendly-bassoon.git', '.'],
      testRepoPath,
      options
    )

    const cancelResult = await task.cancel()
    try {
      await task.result
    } catch {}
    expect(cancelResult).toBe(GitTaskCancelResult.successfulCancel)
  })

  it('cannot cancel already finished git command', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-do-nothing')
    const task = GitProcess.execTask(['--version'], testRepoPath)
    await task.result

    const cancelResult = await task.cancel()
    expect(cancelResult).toBe(GitTaskCancelResult.processAlreadyEnded)
  })

  it('can launch git', async () => {
    const result = await GitProcess.exec(['--version'], __dirname)
    expect(result.stderr).toBe('')
    if (result.stdout.includes('windows')) {
      expect(result.stdout).toContain(`git version ${gitForWindowsVersion}`)
    } else {
      expect(result.stdout).toContain(`git version ${gitVersion}`)
    }
    expect(result.exitCode).toBe(0)
  })

  describe('exitCode', () => {
    it('returns exit code when folder is empty', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const result = await GitProcess.exec(['show', 'HEAD'], testRepoPath)
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
    })

    it('handles stdin closed errors', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')

      // Pass an unknown arg to Git, forcing it to terminate immediately
      // and then try to write to stdin. Without the ignoreClosedInputStream
      // workaround this will crash the process (timing related) with an
      // EPIPE/EOF error thrown from process.stdin
      const result = await GitProcess.exec(['--trololol'], testRepoPath, {
        stdin: '\n'.repeat(1024 * 1024),
      })
      verify(result, r => {
        expect(r.exitCode).toBe(129)
      })
    })

    describe('diff', () => {
      it('returns expected error code for initial commit when creating diff', async () => {
        const testRepoPath = await initialize('blank-no-commits')

        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, 'this is a new file')
        const result = await GitProcess.exec(
          [
            'diff',
            '--no-index',
            '--patch-with-raw',
            '-z',
            '--',
            '/dev/null',
            'new-file.md',
          ],
          testRepoPath
        )

        verify(result, r => {
          expect(r.exitCode).toBe(1)
          expect(r.stdout.length).toBeGreaterThan(0)
        })
      })

      it('returns expected error code for repository with history when creating diff', async () => {
        const testRepoPath = await initialize('blank-then-commit')
        const readme = path.join(testRepoPath, 'README.md')
        fs.writeFileSync(readme, 'hello world!')
        await GitProcess.exec(['add', '.'], testRepoPath)

        const commit = await GitProcess.exec(
          ['commit', '-F', '-'],
          testRepoPath,
          {
            stdin: 'hello world!',
          }
        )
        expect(commit.exitCode).toBe(0)

        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, 'this is a new file')
        const result = await GitProcess.exec(
          [
            'diff',
            '--no-index',
            '--patch-with-raw',
            '-z',
            '--',
            '/dev/null',
            'new-file.md',
          ],
          testRepoPath
        )

        verify(result, r => {
          expect(r.exitCode).toBe(1)
          expect(r.stdout.length).toBeGreaterThan(0)
        })
      })

      it('throws error when exceeding the output range', async () => {
        const testRepoPath = temp.mkdirSync('blank-then-large-file')

        // NOTE: if we change the default buffer size in git-process
        // this test may no longer fail as expected - see https://git.io/v1dq3
        const output = crypto.randomBytes(10 * 1024 * 1024).toString('hex')
        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, output)

        // TODO: convert this to assert the error was thrown

        let throws = false
        try {
          await GitProcess.exec(
            [
              'diff',
              '--no-index',
              '--patch-with-raw',
              '-z',
              '--',
              '/dev/null',
              'new-file.md',
            ],
            testRepoPath
          )
        } catch {
          throws = true
        }
        expect(throws).toBe(true)
      })
    })

    describe('show', () => {
      it('exiting file', async () => {
        const testRepoPath = await initialize('desktop-show-existing')
        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(
          ['show', ':file.txt'],
          testRepoPath
        )
        verify(result, r => {
          expect(r.exitCode).toBe(0)
          expect(r.stdout.trim()).toBe('some content')
        })
      })
      it('missing from index', async () => {
        const testRepoPath = await initialize('desktop-show-missing-index')

        const result = await GitProcess.exec(
          ['show', ':missing.txt'],
          testRepoPath
        )

        expect(result).toHaveGitError(GitError.PathDoesNotExist)
      })
      it('missing from commitish', async () => {
        const testRepoPath = await initialize('desktop-show-missing-commitish')

        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(
          ['show', 'HEAD:missing.txt'],
          testRepoPath
        )

        expect(result).toHaveGitError(GitError.PathDoesNotExist)
      })
      it('invalid object name - empty repository', async () => {
        const testRepoPath = await initialize(
          'desktop-show-invalid-object-empty'
        )

        const result = await GitProcess.exec(
          ['show', 'HEAD:missing.txt'],
          testRepoPath
        )

        expect(result).toHaveGitError(GitError.InvalidObjectName)
      })
      it('outside repository', async () => {
        const testRepoPath = await initialize('desktop-show-outside')

        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(
          ['show', '--', '/missing.txt'],
          testRepoPath
        )

        expect(result).toHaveGitError(GitError.OutsideRepository)
      })
    })
  })

  describe('errors', () => {
    it('each error code should have its corresponding regexp', () => {
      const difference = (left: number[], right: number[]) =>
        left.filter(item => right.indexOf(item) === -1)
      const errorCodes = Object.keys(GitError)
        .map(key => (GitError as any)[key])
        .filter(ordinal => Number.isInteger(ordinal))
      const regexes = Object.keys(GitErrorRegexes).map(
        key => (GitErrorRegexes as any)[key]
      )

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
        error = e as Error
      }

      expect(error!.message).toBe('Unable to find path to repository on disk.')
      expect((error as any).code).toBe(RepositoryDoesNotExistErrorCode)
    })

    it('can parse HTTPS auth errors', () => {
      const error = GitProcess.parseError(
        "fatal: Authentication failed for 'https://www.github.com/shiftkey/desktop.git/'"
      )
      expect(error).toBe(GitError.HTTPSAuthenticationFailed)
    })

    it('can parse HTTP auth errors', () => {
      const error = GitProcess.parseError(
        "fatal: Authentication failed for 'http://localhost:3000'"
      )
      expect(error).toBe(GitError.HTTPSAuthenticationFailed)
    })

    it('can parse SSH auth errors', () => {
      const error = GitProcess.parseError('fatal: Authentication failed')
      expect(error).toBe(GitError.SSHAuthenticationFailed)
    })

    it('can parse bad revision errors', () => {
      const error = GitProcess.parseError(
        "fatal: bad revision 'beta..origin/beta'"
      )
      expect(error).toBe(GitError.BadRevision)
    })

    it('can parse unrelated histories error', () => {
      const stderr = `fatal: refusing to merge unrelated histories`

      const error = GitProcess.parseError(stderr)
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

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.PushWithFileSizeExceedingLimit)
    })

    it('can parse GH002 branch name error', () => {
      const stderr = `remote: error: GH002: Sorry, branch or tag names consisting of 40 hex characters are not allowed.
remote: error: Invalid branch or tag name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa -> aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.HexBranchNameRejected)
    })

    it('can parse GH003 force push error', () => {
      const stderr = `remote: error: GH003: Sorry, force-pushing to my-cool-branch is not allowed.
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected]  my-cool-branch ->  my-cool-branch (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ForcePushRejected)
    })

    it('can parse GH005 ref length error', () => {
      const stderr = `remote: error: GH005: Sorry, refs longer than 255 bytes are not allowed.
To https://github.com/shiftkey/too-large-repository.git
...`
      // there's probably some output here missing but I couldn't trigger this locally

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.InvalidRefLength)
    })

    it('can parse GH006 protected branch push error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: At least one approved review is required
To https://github.com/shiftkey-tester/protected-branches.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey-tester/protected-branches.git'`
      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ProtectedBranchRequiresReview)
    })

    it('can parse GH006 protected branch force push error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Cannot force-push to a protected branch
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ProtectedBranchForcePush)
    })

    it('can parse GH006 protected branch delete error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/dupe.
remote: error: Cannot delete a protected branch
To https://github.com/tierninho-tester/trterdgdfgdf.git
  ! [remote rejected] dupe (protected branch hook declined)
error: failed to push some refs to 'https://github.com/tierninho-tester/trterdgdfgdf.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ProtectedBranchDeleteRejected)
    })

    it('can parse GH006 required status check error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Required status check "continuous-integration/travis-ci" is expected.
To https://github.com/Raul6469/EclipseMaven.git
  ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/Raul6469/EclipseMaven.git`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ProtectedBranchRequiredStatus)
    })

    it('can parse GH007 push with private email error', () => {
      const stderr = `remote: error: GH007: Your push would publish a private email address.
remote: You can make your email public or disable this protection by visiting:
remote: http://github.com/settings/emails`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.PushWithPrivateEmail)
    })

    it('can parse LFS attribute does not match error', () => {
      const stderr = `The filter.lfs.clean attribute should be "git-lfs clean -- %f" but is "git lfs clean %f"`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.LFSAttributeDoesNotMatch)
    })

    it('can parse rename Branch error', () => {
      const stderr = `error: refname refs/heads/adding-renamefailed-error not found
      fatal: Branch rename failed`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.BranchRenameFailed)
    })

    it('can parse path does not exist error - neither on disk nor in the index', () => {
      const stderr =
        "fatal: path 'missing.txt' does not exist (neither on disk nor in the index).\n"

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.PathDoesNotExist)
    })

    it('can parse path does not exist error - in commitish', () => {
      const stderr = "fatal: path 'missing.txt' does not exist in 'HEAD'\n"

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.PathDoesNotExist)
    })

    it('can parse invalid object name error', () => {
      const stderr = "fatal: invalid object name 'HEAD'.\n"

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.InvalidObjectName)
    })

    it('can parse is outside repository error', () => {
      const stderr =
        "fatal: /missing.txt: '/missing.txt' is outside repository\n"

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.OutsideRepository)
    })

    it('can parse lock file exists error', () => {
      const stderr = `Unable to create  'path_to_repo/.git/index.lock: File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.LockFileAlreadyExists)
    })

    it('can parse the previous not found repository error', () => {
      const stderr =
        'fatal: Not a git repository (or any of the parent directories): .git'

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.NotAGitRepository)
    })

    it('can parse the current found repository error', () => {
      const stderr =
        'fatal: not a git repository (or any of the parent directories): .git'

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.NotAGitRepository)
    })

    it('can parse the no merge to abort error', () => {
      const stderr = 'fatal: There is no merge to abort (MERGE_HEAD missing).\n'

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.NoMergeToAbort)
    })

    it('can parse the pulling non-existent remote branch error', () => {
      const stderr =
        "Your configuration specifies to merge with the ref 'refs/heads/tierninho-patch-1'\nfrom the remote, but no such ref was fetched.\n"

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.NoExistingRemoteBranch)
    })

    it('can parse the local files overwritten error', () => {
      let stderr =
        'error: Your local changes to the following files would be overwritten by checkout:\n'

      let error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.LocalChangesOverwritten)

      stderr =
        'error: The following untracked working tree files would be overwritten by checkout:\n'

      error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.LocalChangesOverwritten)
    })

    it('can parse the unresovled conflicts error', () => {
      const stderr = `2-simple-rebase-conflict/LICENSE.md: needs merge
You must edit all merge conflicts and then
mark them as resolved using git add`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.UnresolvedConflicts)
    })

    it('can parse the failed to sign data error within a rebase', () => {
      const stderr = `Rebasing (1/4)
      Rebasing (2/4)
      error: gpg failed to sign the data`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.GPGFailedToSignData)
    })

    it('can parse the could not resolve host error', () => {
      const stderr = `"Cloning into '/cloneablepath/'...\nfatal: unable to access 'https://github.com/Daniel-McCarthy/dugite.git/': Could not resolve host: github.com\n"`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.HostDown)
    })

    it('can parse an error when merging with local changes', async () => {
      const repoPath = await initialize('desktop-merge-with-local-changes')
      const readmePath = path.join(repoPath, 'Readme.md')

      // Add a commit to the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], repoPath)

      // Create another branch and add commit.
      await GitProcess.exec(['checkout', '-b', 'some-other-branch'], repoPath)
      fs.writeFileSync(readmePath, '# README modified in branch', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"updated README"'], repoPath)

      // Go back to the default branch and modify a file.
      await GitProcess.exec(['checkout', '-'], repoPath)
      fs.writeFileSync(readmePath, '# README modified in master', {
        encoding: 'utf8',
      })

      // Execute a merge.
      const result = await GitProcess.exec(
        ['merge', 'some-other-branch'],
        repoPath
      )

      expect(result).toHaveGitError(GitError.MergeWithLocalChanges)
    })

    it('can parse an error when renasing with local changes', async () => {
      const repoPath = await initialize('desktop-merge-with-local-changes')
      const readmePath = path.join(repoPath, 'Readme.md')

      // Add a commit to the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], repoPath)

      // Create another branch and add commit.
      await GitProcess.exec(['checkout', '-b', 'some-other-branch'], repoPath)
      fs.writeFileSync(readmePath, '# README modified in branch', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"updated README"'], repoPath)

      // Go back to the default branch and modify a file.
      await GitProcess.exec(['checkout', '-'], repoPath)
      fs.writeFileSync(readmePath, '# README modified in master', {
        encoding: 'utf8',
      })

      // Execute a rebase.
      const result = await GitProcess.exec(
        ['rebase', 'some-other-branch'],
        repoPath
      )

      expect(result).toHaveGitError(GitError.RebaseWithLocalChanges)
    })

    it('can parse an error when pulling with merge with local changes', async () => {
      const { path: repoPath, remote: remoteRepositoryPath } =
        await initializeWithRemote(
          'desktop-pullrebase-with-local-changes',
          null
        )
      const { path: forkRepoPath } = await initializeWithRemote(
        'desktop-pullrebase-with-local-changes-fork',
        remoteRepositoryPath
      )
      await GitProcess.exec(['config', 'pull.rebase', 'false'], forkRepoPath)
      const readmePath = path.join(repoPath, 'Readme.md')
      const readmePathInFork = path.join(forkRepoPath, 'Readme.md')

      // Add a commit to the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], repoPath)

      // Push the commit and fetch it from the fork.
      await GitProcess.exec(['push', 'origin', 'HEAD', '-u'], repoPath)
      await GitProcess.exec(['pull', 'origin', 'HEAD'], forkRepoPath)

      // Add another commit and push it
      fs.writeFileSync(readmePath, '# README modified from upstream', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"updated README"'], repoPath)
      await GitProcess.exec(['push', 'origin'], repoPath)

      // Modify locally the Readme file in the fork.
      fs.writeFileSync(readmePathInFork, '# README modified from fork', {
        encoding: 'utf8',
      })

      // Pull from the fork
      const result = await GitProcess.exec(
        ['pull', 'origin', 'HEAD'],
        forkRepoPath
      )

      expect(result).toHaveGitError(GitError.MergeWithLocalChanges)
    })

    it('can parse an error when pulling with rebase with local changes', async () => {
      const { path: repoPath, remote: remoteRepositoryPath } =
        await initializeWithRemote(
          'desktop-pullrebase-with-local-changes',
          null
        )
      const { path: forkRepoPath } = await initializeWithRemote(
        'desktop-pullrebase-with-local-changes-fork',
        remoteRepositoryPath
      )
      await GitProcess.exec(['config', 'pull.rebase', 'true'], forkRepoPath)
      const readmePath = path.join(repoPath, 'Readme.md')
      const readmePathInFork = path.join(forkRepoPath, 'Readme.md')

      // Add a commit to the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], repoPath)

      // Push the commit and fetch it from the fork.
      await GitProcess.exec(['push', 'origin', 'HEAD', '-u'], repoPath)
      await GitProcess.exec(['pull', 'origin', 'HEAD'], forkRepoPath)

      // Add another commit and push it
      fs.writeFileSync(readmePath, '# README modified from upstream', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"updated README"'], repoPath)
      await GitProcess.exec(['push', 'origin'], repoPath)

      // Modify locally the Readme file in the fork.
      fs.writeFileSync(readmePathInFork, '# README modified from fork', {
        encoding: 'utf8',
      })

      // Pull from the fork
      const result = await GitProcess.exec(
        ['pull', 'origin', 'HEAD'],
        forkRepoPath
      )

      expect(result).toHaveGitError(GitError.RebaseWithLocalChanges)
    })

    it('can parse an error when there is a conflict while merging', async () => {
      const repoPath = await initialize('desktop-pullrebase-with-local-changes')
      const readmePath = path.join(repoPath, 'Readme.md')

      // Create a commit on the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"initial commit"'], repoPath)

      // Create a branch and add another commit.
      await GitProcess.exec(['checkout', '-b', 'my-branch'], repoPath)
      fs.writeFileSync(readmePath, '# README from my-branch', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(
        ['commit', '-m', '"modify README in my-branch"'],
        repoPath
      )

      // Go back to the default branch and add a commit that conflicts.
      await GitProcess.exec(['checkout', '-'], repoPath)
      fs.writeFileSync(readmePath, '# README from default', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(
        ['commit', '-m', '"modifiy README in default branch"'],
        repoPath
      )

      // Try to merge the branch.
      const result = await GitProcess.exec(['merge', 'my-branch'], repoPath)

      expect(result).toHaveGitError(GitError.MergeConflicts)
    })

    it('can parse an error when there is a conflict while rebasing', async () => {
      const repoPath = await initialize('desktop-pullrebase-with-local-changes')
      const readmePath = path.join(repoPath, 'Readme.md')

      // Create a commit on the default branch.
      fs.writeFileSync(readmePath, '# README', { encoding: 'utf8' })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(['commit', '-m', '"initial commit"'], repoPath)

      // Create a branch and add another commit.
      await GitProcess.exec(['checkout', '-b', 'my-branch'], repoPath)
      fs.writeFileSync(readmePath, '# README from my-branch', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(
        ['commit', '-m', '"modify README in my-branch"'],
        repoPath
      )

      // Go back to the default branch and add a commit that conflicts.
      await GitProcess.exec(['checkout', '-'], repoPath)
      fs.writeFileSync(readmePath, '# README from default', {
        encoding: 'utf8',
      })
      await GitProcess.exec(['add', '.'], repoPath)
      await GitProcess.exec(
        ['commit', '-m', '"modifiy README in default branch"'],
        repoPath
      )

      // Try to merge the branch.
      const result = await GitProcess.exec(['rebase', 'my-branch'], repoPath)

      expect(result).toHaveGitError(GitError.RebaseConflicts)
    })

    it('can parse conflict modify delete error', () => {
      const stderr =
        'CONFLICT (modify/delete): a/path/to/a/file.md deleted in HEAD and modified in 1234567 (A commit message). Version 1234567 (A commit message) of a/path/to/a/file.md left in tree.'

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.ConflictModifyDeletedInBranch)
    })

    it('can parse path exists but not in ref', () => {
      const stderr = `fatal: path 'README.md' exists on disk, but not in '4b825dc642cb6eb9a060e54bf8d69288fbee4904'`

      const error = GitProcess.parseError(stderr)
      expect(error).toBe(GitError.PathExistsButNotInRef)
    })
  })
})
