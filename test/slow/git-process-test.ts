import * as Fs from 'fs'
import * as Path from 'path'

import { GitProcess, GitError } from '../../lib'
import { initialize, verify } from '../helpers'
import { setupAskPass, setupNoAuth } from './auth'
import { pathToFileURL } from 'url'
import { resolve } from 'path'

const temp = require('temp').track()

describe('git-process', () => {
  describe('clone', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupNoAuth(),
      }

      const result = await GitProcess.exec(
        [
          'clone',
          '--',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
          '.',
        ],
        testRepoPath,
        options
      )

      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupAskPass('error', 'error'),
      }
      const result = await GitProcess.exec(
        [
          'clone',
          '--',
          'https://github.com/desktop/super-secret-mega-private-repo.git',
          '.',
        ],
        testRepoPath,
        options
      )
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
      const error = GitProcess.parseError(result.stderr)
      expect(error).toBe(GitError.HTTPSAuthenticationFailed)
    })
  })

  describe('fetch', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')

      const addRemote = await GitProcess.exec(
        [
          'remote',
          'add',
          'origin',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
        ],
        testRepoPath
      )
      verify(addRemote, r => {
        expect(r.exitCode).toBe(0)
      })

      const options = {
        env: setupNoAuth(),
      }
      const result = await GitProcess.exec(
        ['fetch', 'origin'],
        testRepoPath,
        options
      )
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
    })
  })

  describe('checkout', () => {
    it('runs hook without error', async () => {
      const testRepoPath = await initialize(
        'desktop-git-checkout-hooks',
        'main'
      )
      const readme = Path.join(testRepoPath, 'README.md')

      Fs.writeFileSync(readme, '# README', { encoding: 'utf8' })

      await GitProcess.exec(['add', '.'], testRepoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], testRepoPath)

      await GitProcess.exec(
        ['checkout', '-b', 'some-other-branch'],
        testRepoPath
      )

      const postCheckoutScript = `#!/bin/sh
echo 'post-check out hook ran'`
      const postCheckoutFile = Path.join(
        testRepoPath,
        '.git',
        'hooks',
        'post-checkout'
      )

      Fs.writeFileSync(postCheckoutFile, postCheckoutScript, {
        encoding: 'utf8',
        mode: '755',
      })

      const result = await GitProcess.exec(['checkout', 'main'], testRepoPath)
      verify(result, r => {
        expect(r.exitCode).toBe(0)
        expect(r.stderr).toContain('post-check out hook ran')
      })
    })
  })
})
