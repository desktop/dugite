import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../lib/git-process'

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.execWithOutput([ '--version' ], __dirname)
    expect(result.stdout.length).to.be.greaterThan(0)
  })
})
