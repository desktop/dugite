import * as chai from 'chai'
const expect = chai.expect

import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

import { GitProcess, GitError, RepositoryDoesNotExistErrorCode } from '../../lib'
import { GitErrorRegexes } from '../../lib/errors'
import { initialize, verify } from '../helpers'

import { gitVersion } from '../helpers'

const temp = require('temp').track()

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.exec(['--version'], __dirname)
    verify(result, r => {
      expect(r.stdout).to.contain(`git version ${gitVersion}`)
    })
  })

  describe('exitCode', () => {
    it('returns exit code when folder is empty', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const result = await GitProcess.exec(['show', 'HEAD'], testRepoPath)
      verify(result, r => {
        expect(r.exitCode).to.equal(128)
      })
    })

    it('handles stdin closed errors', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')

      // Pass an unknown arg to Git, forcing it to terminate immediately
      // and then try to write to stdin. Without the ignoreClosedInputStream
      // workaround this will crash the process (timing related) with an
      // EPIPE/EOF error thrown from process.stdin
      const result = await GitProcess.exec(['--trololol'], testRepoPath, {
        stdin: '\n'.repeat(1024 * 1024)
      })
      verify(result, r => {
        expect(r.exitCode).to.equal(129)
      })
    })

    describe('diff', () => {
      it('returns expected error code for initial commit when creating diff', async () => {
        const testRepoPath = await initialize('blank-no-commits')

        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, 'this is a new file')
        const result = await GitProcess.exec(
          ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
          testRepoPath
        )

        verify(result, r => {
          expect(r.exitCode).to.equal(1)
          expect(r.stdout.length).to.be.greaterThan(0)
        })
      })

      it('returns expected error code for repository with history when creating diff', async () => {
        const testRepoPath = await initialize('blank-then-commit')
        const readme = path.join(testRepoPath, 'README.md')
        fs.writeFileSync(readme, 'hello world!')
        await GitProcess.exec(['add', '.'], testRepoPath)

        const commit = await GitProcess.exec(['commit', '-F', '-'], testRepoPath, {
          stdin: 'hello world!'
        })
        expect(commit.exitCode).to.eq(0)

        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, 'this is a new file')
        const result = await GitProcess.exec(
          ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
          testRepoPath
        )

        verify(result, r => {
          expect(r.exitCode).to.equal(1)
          expect(r.stdout.length).to.be.greaterThan(0)
        })
      })

      it('throws error when exceeding the output range', async () => {
        const testRepoPath = temp.mkdirSync('blank-then-large-file')

        // NOTE: if we change the default buffer size in git-process
        // this test may no longer fail as expected - see https://git.io/v1dq3
        const output = crypto.randomBytes(10 * 1024 * 1024).toString('hex')
        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, output)

        let throws = false
        try {
          await GitProcess.exec(
            ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
            testRepoPath
          )
        } catch {
          throws = true
        }
        expect(throws).to.be.true
      })
    })

    describe('show', () => {
      it('exiting file', async () => {
        const testRepoPath = await initialize('desktop-show-existing')
        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(['show', ':file.txt'], testRepoPath)
        verify(result, r => {
          expect(r.exitCode).to.be.equal(0)
          expect(r.stdout.trim()).to.be.equal('some content')
        })
      })
      it('missing from index', async () => {
        const testRepoPath = await initialize('desktop-show-missing-index')

        const result = await GitProcess.exec(['show', ':missing.txt'], testRepoPath)
        verify(result, r => {
          expect(GitProcess.parseError(r.stderr)).to.be.equal(GitError.PathDoesNotExist)
        })
      })
      it('missing from commitish', async () => {
        const testRepoPath = await initialize('desktop-show-missing-commitish')

        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(['show', 'HEAD:missing.txt'], testRepoPath)
        verify(result, r => {
          expect(GitProcess.parseError(r.stderr)).to.be.equal(GitError.PathDoesNotExist)
        })
      })
      it('invalid object name - empty repository', async () => {
        const testRepoPath = await initialize('desktop-show-invalid-object-empty')

        const result = await GitProcess.exec(['show', 'HEAD:missing.txt'], testRepoPath)
        verify(result, r => {
          expect(GitProcess.parseError(r.stderr)).to.be.equal(GitError.InvalidObjectName)
        })
      })
      it('outside repository', async () => {
        const testRepoPath = await initialize('desktop-show-outside')

        const filePath = path.join(testRepoPath, 'file.txt')

        fs.writeFileSync(filePath, 'some content', { encoding: 'utf8' })

        await GitProcess.exec(['add', '.'], testRepoPath)
        await GitProcess.exec(['commit', '-m', '"added a file"'], testRepoPath)

        const result = await GitProcess.exec(['show', '--', '/missing.txt'], testRepoPath)
        verify(result, r => {
          expect(GitProcess.parseError(r.stderr)).to.be.equal(GitError.OutsideRepository)
        })
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
      const regexes = Object.keys(GitErrorRegexes).map(key => (GitErrorRegexes as any)[key])

      const errorCodesWithoutRegex = difference(errorCodes, regexes)
      const regexWithoutErrorCodes = difference(regexes, errorCodes)

      expect(errorCodesWithoutRegex).to.be.empty
      expect(regexWithoutErrorCodes).to.be.empty
    })

    it('raises error when folder does not exist', async () => {
      const testRepoPath = path.join(temp.path(), 'desktop-does-not-exist')

      let error: Error | null = null
      try {
        await GitProcess.exec(['show', 'HEAD'], testRepoPath)
      } catch (e) {
        error = e
      }

      expect(error!.message).to.equal('Unable to find path to repository on disk.')
      expect((error as any).code).to.equal(RepositoryDoesNotExistErrorCode)
    })

    it('can parse errors', () => {
      const error = GitProcess.parseError('fatal: Authentication failed')
      expect(error).to.equal(GitError.SSHAuthenticationFailed)
    })

    it('can parse bad revision errors', () => {
      const error = GitProcess.parseError("fatal: bad revision 'beta..origin/beta'")
      expect(error).to.equal(GitError.BadRevision)
    })

    it('can parse unrelated histories error', () => {
      const stderr = `fatal: refusing to merge unrelated histories`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.CannotMergeUnrelatedHistories)
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
      expect(error).to.equal(GitError.PushWithFileSizeExceedingLimit)
    })

    it('can parse GH002 branch name error', () => {
      const stderr = `remote: error: GH002: Sorry, branch or tag names consisting of 40 hex characters are not allowed.
remote: error: Invalid branch or tag name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa -> aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.HexBranchNameRejected)
    })

    it('can parse GH003 force push error', () => {
      const stderr = `remote: error: GH003: Sorry, force-pushing to my-cool-branch is not allowed.
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected]  my-cool-branch ->  my-cool-branch (pre-receive hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.ForcePushRejected)
    })

    it('can parse GH005 ref length error', () => {
      const stderr = `remote: error: GH005: Sorry, refs longer than 255 bytes are not allowed.
To https://github.com/shiftkey/too-large-repository.git
...`
      // there's probably some output here missing but I couldn't trigger this locally

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.InvalidRefLength)
    })

    it('can parse GH006 protected branch push error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: At least one approved review is required
To https://github.com/shiftkey-tester/protected-branches.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey-tester/protected-branches.git'`
      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.ProtectedBranchRequiresReview)
    })

    it('can parse GH006 protected branch force push error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Cannot force-push to a protected branch
To https://github.com/shiftkey/too-large-repository.git
 ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/shiftkey/too-large-repository.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.ProtectedBranchForcePush)
    })

    it('can parse GH006 protected branch delete error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/dupe.
remote: error: Cannot delete a protected branch
To https://github.com/tierninho-tester/trterdgdfgdf.git
  ! [remote rejected] dupe (protected branch hook declined)
error: failed to push some refs to 'https://github.com/tierninho-tester/trterdgdfgdf.git'`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.ProtectedBranchDeleteRejected)
    })

    it('can parse GH006 required status check error', () => {
      const stderr = `remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: Required status check "continuous-integration/travis-ci" is expected.
To https://github.com/Raul6469/EclipseMaven.git
  ! [remote rejected] master -> master (protected branch hook declined)
error: failed to push some refs to 'https://github.com/Raul6469/EclipseMaven.git`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.ProtectedBranchRequiredStatus)
    })

    it('can parse GH007 push with private email error', () => {
      const stderr = `remote: error: GH007: Your push would publish a private email address.
remote: You can make your email public or disable this protection by visiting:
remote: http://github.com/settings/emails`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.PushWithPrivateEmail)
    })

    it('can parse LFS attribute does not match error', () => {
      const stderr = `The filter.lfs.clean attribute should be "git-lfs clean -- %f" but is "git lfs clean %f"`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.LFSAttributeDoesNotMatch)
    })

    it('can parse rename Branch error', () => {
      const stderr = `error: refname refs/heads/adding-renamefailed-error not found
      fatal: Branch rename failed`

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.BranchRenameFailed)
    })

    it('can parse path does not exist error - neither on disk nor in the index', () => {
      const stderr =
        "fatal: Path 'missing.txt' does not exist (neither on disk nor in the index).\n"

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.PathDoesNotExist)
    })

    it('can parse path does not exist error - in commitish', () => {
      const stderr = "fatal: Path 'missing.txt' does not exist in 'HEAD'\n"

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.PathDoesNotExist)
    })

    it('can parse invalid object name error', () => {
      const stderr = "fatal: Invalid object name 'HEAD'.\n"

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.InvalidObjectName)
    })

    it('can parse is outside repository error', () => {
      const stderr = "fatal: /missing.txt: '/missing.txt' is outside repository\n"

      const error = GitProcess.parseError(stderr)
      expect(error).to.equal(GitError.OutsideRepository)
    })

    it('can parse lock file exists error', () => {
      const stderr = `Unable to create '%s.lock': %s.\n
      \n
      Another git process seems to be running in this repository, e.g.\n
      an editor opened by 'git commit'. Please make sure all processes\n
      are terminated then try again. If it still fails, a git process\n
      may have crashed in this repository earlier:\n
      remove the file manually to continue.`;

      const error = GitProcess.parseError(stderr);
      expect(error).to.equal(GitError.LockFileAlreadyExists);

    });
  })
})
