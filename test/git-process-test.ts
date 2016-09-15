import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../lib/git-process'

describe('git-process', () => {
  describe('can launch git', async () => {
    const version  = await GitProcess.execWithOutput([ '--version' ], __dirname)
    expect(version.length).to.be.greaterThan(0)
  })
})
