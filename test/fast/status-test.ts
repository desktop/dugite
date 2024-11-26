import { createTestDir, verify } from '../helpers'

import * as Fs from 'fs'
import * as Path from 'path'
import assert from 'assert'
import { describe, it } from 'node:test'
import { exec } from '../../lib'

describe('status', () => {
  it('lists untracked file', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-commit')
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
