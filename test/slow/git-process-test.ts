import * as chai from 'chai'
const expect = chai.expect

import { GitProcess, GitError } from '../../lib'
import { setupAskPass, setupNoAuth } from './auth'

const temp = require('temp').track()

describe('git-process', () => {
  before(async () => {
    const homeDirectory = ''
    const config = await GitProcess.exec([ 'config', 'credential.helper' ], homeDirectory)
    if (config.exitCode === 0) {
      const configValue = config.stdout.trim()
      console.warn(`WARNING:`)
      console.warn(`You have a credential helper enabled: credential.helper=${configValue}`)
      console.warn(`This will affect some of the test methods defined here`)
    }
  })

  describe('clone', () => {
    it('returns exit code and error when repository doesn\'t exist', async () => {
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
      const result = await GitProcess.exec([ 'clone', '--', 'https://bitbucket.org/shiftkey/testing-non-existent.git', '.'], testRepoPath, options)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSRepositoryNotFound)
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupAskPass('error', 'error')
      }
      const result = await GitProcess.exec([ 'clone', '--', 'https://github.com/shiftkey/repository-private.git', '.'], testRepoPath, options)
      console.log(`stdout: ${result.stdout}`)
      console.log(`stderr: ${result.stderr}`)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSAuthenticationFailed)
    })
  })
})