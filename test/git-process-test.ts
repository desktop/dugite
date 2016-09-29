import * as chai from 'chai'
const expect = chai.expect

import { GitProcess, GitError } from '../lib'

const temp = require('temp').track()

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.execWithOutput([ '--version' ], __dirname)
    expect(result.stdout.length).to.be.greaterThan(0)
  })

  it('returns exit code when folder is empty', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
    const result = await GitProcess.execWithOutput([ 'show', 'HEAD' ], testRepoPath)
    expect(result.exitCode).to.equal(128)
  })

  it('can parse errors', () => {
    const error = GitProcess.parseError('fatal: Authentication failed')
    expect(error).to.equal(GitError.SSHAuthenticationFailed)
  })
})
