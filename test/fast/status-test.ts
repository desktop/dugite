import { verify } from '../helpers'
import { track } from 'temp'

import * as Fs from 'fs'
import * as Path from 'path'
import assert from 'assert'
import { describe, it } from 'node:test'
import { exec } from '../../lib'

const temp = track()

describe('status', () => {
  it('lists untracked file', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-commit')

    await exec(['init'], testRepoPath)

    const readme = Path.join(testRepoPath, 'README.md')
    Fs.writeFileSync(readme, 'HELLO WORLD!')

    await exec(['add', 'README.md'], testRepoPath)

    const result = await exec(
      ['status', '--untracked-files=all', '--porcelain', '-z'],
      testRepoPath
    )

    verify(result, r => {
      assert.equal(r.exitCode, 0)
      assert.ok(r.stdout.includes('README.md'), 'README.md expected in output')
    })
  })
})
