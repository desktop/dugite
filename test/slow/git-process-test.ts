import * as Fs from 'fs'
import * as Path from 'path'

import { GitProcess, GitError } from '../../lib'
import { initialize, verify } from '../helpers'
import { setupAskPass, setupNoAuth } from './auth'

const temp = require('temp').track()

describe('git-process', () => {
  describe('clone', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupNoAuth()
      }

      // GitHub will prompt for (and validate) credentials for non-public
      // repositories, to prevent leakage of information.
      // Bitbucket will not prompt for credentials, and will immediately
      // return whether this non-public repository exists.
      //
      // This is an easier to way to test for the specific error than to
      // pass live account credentials to Git.
      const result = await GitProcess.exec(
        ['clone', '--', 'https://bitbucket.org/shiftkey/testing-non-existent.git', '.'],
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
        env: setupAskPass('error', 'error')
      }
      const result = await GitProcess.exec(
        ['clone', '--', 'https://github.com/shiftkey/repository-private.git', '.'],
        testRepoPath,
        options
      )
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
      const error = GitProcess.parseError(result.stderr)
      expect(error).toBe(GitError.HTTPSAuthenticationFailed)
    })

    it('returns exit code when successful', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-clone-valid')
      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec(
        ['clone', '--', 'https://github.com/shiftkey/friendly-bassoon.git', '.'],
        testRepoPath,
        options
      )
      verify(result, r => {
        expect(r.exitCode).toBe(0)
      })
    })
  })

  describe('fetch', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')

      // GitHub will prompt for (and validate) credentials for non-public
      // repositories, to prevent leakage of information.
      // Bitbucket will not prompt for credentials, and will immediately
      // return whether this non-public repository exists.
      //
      // This is an easier to way to test for the specific error than to
      // pass live account credentials to Git.
      const addRemote = await GitProcess.exec(
        ['remote', 'add', 'origin', 'https://bitbucket.org/shiftkey/testing-non-existent.git'],
        testRepoPath
      )
      verify(addRemote, r => {
        expect(r.exitCode).toBe(0)
      })

      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec(['fetch', 'origin'], testRepoPath, options)
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')
      const addRemote = await GitProcess.exec(
        ['remote', 'add', 'origin', 'https://github.com/shiftkey/repository-private.git'],
        testRepoPath
      )
      verify(addRemote, r => {
        expect(r.exitCode).toBe(0)
      })

      const options = {
        env: setupAskPass('error', 'error')
      }
      const result = await GitProcess.exec(['fetch', 'origin'], testRepoPath, options)
      verify(result, r => {
        expect(r.exitCode).toBe(128)
      })
      const error = GitProcess.parseError(result.stderr)
      expect(error).toBe(GitError.HTTPSAuthenticationFailed)
    })

    it('returns exit code when successful', async () => {
      const testRepoPath = await initialize('desktop-git-fetch-valid')
      const addRemote = await GitProcess.exec(
        ['remote', 'add', 'origin', 'https://github.com/shiftkey/friendly-bassoon.git'],
        testRepoPath
      )
      verify(addRemote, r => {
        expect(r.exitCode).toBe(0)
      })

      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec(['fetch', 'origin'], testRepoPath, options)
      verify(result, r => {
        expect(r.exitCode).toBe(0)
      })
    })
  })

  describe('checkout', () => {
    it('runs hook without error', async () => {
      const testRepoPath = await initialize('desktop-git-checkout-hooks', 'main')
      const readme = Path.join(testRepoPath, 'README.md')

      Fs.writeFileSync(readme, '# README', { encoding: 'utf8' })

      await GitProcess.exec(['add', '.'], testRepoPath)
      await GitProcess.exec(['commit', '-m', '"added README"'], testRepoPath)

      await GitProcess.exec(['checkout', '-b', 'some-other-branch'], testRepoPath)

      const postCheckoutScript = `#!/bin/sh
echo 'post-check out hook ran'`
      const postCheckoutFile = Path.join(testRepoPath, '.git', 'hooks', 'post-checkout')

      Fs.writeFileSync(postCheckoutFile, postCheckoutScript, { encoding: 'utf8', mode: '755' })

      const result = await GitProcess.exec(['checkout', 'main'], testRepoPath)
      verify(result, r => {
        expect(r.exitCode).toBe(0)
        expect(r.stderr).toContain('post-check out hook ran')
      })
    })
  })
})
