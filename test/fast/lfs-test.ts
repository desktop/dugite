// This shouldn't be necessary, but without this CI fails on Windows. Seems to
// be a bug in TS itself or ts-node.
/// <reference path="../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'

const temp = require('temp').track()

describe('lfs', () => {
  it('can be resolved', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec([ 'lfs' ], testRepoPath)
    expect(result.exitCode).to.equal(0)
    expect(result.stderr).to.contain('Git LFS is a system for managing and versioning large files')
  })
})
