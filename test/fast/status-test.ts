import { GitProcess } from '../../lib'
import { verify } from '../helpers'

import * as Fs from 'fs'
import * as Path from 'path'

const temp = require('temp').track()

describe('status', () => {
  it('lists untracked file', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-commit')

    await GitProcess.exec(['init'], testRepoPath)

    const readme = Path.join(testRepoPath, 'README.md')
    Fs.writeFileSync(readme, 'HELLO WORLD!')

    await GitProcess.exec(['add', 'README.md'], testRepoPath)

    const result = await GitProcess.exec(
      ['status', '--untracked-files=all', '--porcelain', '-z'],
      testRepoPath
    )

    verify(result, r => {
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain('README.md')
    })
  })
})
