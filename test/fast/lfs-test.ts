import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'
import { gitLfsVersion } from '../helpers'

const temp = require('temp').track()

describe('lfs', () => {
  it('can be resolved', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec([ 'lfs' ], testRepoPath)
    expect(result.exitCode).to.equal(0)
    expect(result.stdout).to.contain('Git LFS is a system for managing and versioning large files')
  })

  it('matches the expected version', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec([ 'lfs', 'version' ], testRepoPath)
    expect(result.exitCode).to.equal(0)
    expect(result.stdout).to.contain(`git-lfs/${gitLfsVersion} `)
  })
})
