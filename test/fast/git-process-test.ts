import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

import { GitProcess, GitError } from '../../lib'
import { parseError } from '../../lib/errors'
import { initialize, verify } from '../helpers'

import { gitVersion } from '../helpers'

const temp = require('temp').track()

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.exec(['--version'], __dirname)
    verify(result, r => {
      expect(r.stdout).toContain(`git version ${gitVersion}`)
    })
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
        stdin: '\n'.repeat(1024 * 1024)
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
          ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
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

        const commit = await GitProcess.exec(['commit', '-F', '-'], testRepoPath, {
          stdin: 'hello world!'
        })
        expect(commit.exitCode).toBe(0)

        const file = path.join(testRepoPath, 'new-file.md')
        fs.writeFileSync(file, 'this is a new file')
        const result = await GitProcess.exec(
          ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
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
            ['diff', '--no-index', '--patch-with-raw', '-z', '--', '/dev/null', 'new-file.md'],
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

        const result = await GitProcess.exec(['show', ':file.txt'], testRepoPath)
        verify(result, r => {
          expect(r.exitCode).toBe(0)
          expect(r.stdout.trim()).toBe('some content')
        })
      })

      it('missing from index', async () => {
        const testRepoPath = await initialize('desktop-show-missing-index')

        const result = await GitProcess.exec(['show', ':missing.txt'], testRepoPath)
        verify(result, r => {
          expect(parseError(r.stderr)).toBe(GitError.PathDoesNotExist)
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
          expect(parseError(r.stderr)).toBe(GitError.PathDoesNotExist)
        })
      })
      it('invalid object name - empty repository', async () => {
        const testRepoPath = await initialize('desktop-show-invalid-object-empty')

        const result = await GitProcess.exec(['show', 'HEAD:missing.txt'], testRepoPath)
        verify(result, r => {
          expect(parseError(r.stderr)).toBe(GitError.InvalidObjectName)
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
          expect(parseError(r.stderr)).toBe(GitError.OutsideRepository)
        })
      })
    })
  })
})
