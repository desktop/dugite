import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'
import { verify } from '../helpers'

import * as Fs from 'fs'
import * as Path from 'path'

const temp = require('temp').track()

describe('commit', () => {

  it('can commit changes', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-commit')

    await GitProcess.exec([ 'init' ], testRepoPath)

    // for CI environments, no user info set - so let's stub something in the repo
    await GitProcess.exec([ 'config', 'user.email', '"test@example.com"'], testRepoPath)
    await GitProcess.exec([ 'config', 'user.name', '"Some Test User"'], testRepoPath)

    const readme = Path.join(testRepoPath, 'README.md')
    Fs.writeFileSync(readme, 'HELLO WORLD!')

    await GitProcess.exec([ 'add', 'README.md'], testRepoPath)

    const message = 'committed the README'
    const result = await GitProcess.exec([ 'commit', '-F', '-' ], testRepoPath,  { stdin: message })

    verify(result, r => {
      expect(r.exitCode).to.equal(0)
      expect(r.stdout).to.contain(message)
    })
  })
})
