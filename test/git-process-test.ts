import * as chai from 'chai'
const expect = chai.expect

import * as path from 'path'

import { GitProcess, GitError } from '../lib'

const temp = require('temp').track()

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.exec([ '--version' ], __dirname)
    expect(result.stdout.length).to.be.greaterThan(0)
  })

  it('returns exit code when folder is empty', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
    const result = await GitProcess.exec([ 'show', 'HEAD' ], testRepoPath)
    expect(result.exitCode).to.equal(128)
  })

  it('raises error when folder does not exist', async () => {
    const testRepoPath = path.join(temp.path(), 'desktop-does-not-exist')

    let error: Error | null = null
    try {
      await GitProcess.exec([ 'show', 'HEAD' ], testRepoPath)
    } catch (e) {
      error = e
    }

    expect(error!.message).to.equal('Unable to find path to repository on disk.')
  })

  it('can parse errors', () => {
    const error = GitProcess.parseError('fatal: Authentication failed')
    expect(error).to.equal(GitError.SSHAuthenticationFailed)
  })
})
