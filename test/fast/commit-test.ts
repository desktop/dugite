import assert from 'assert'
import { createTestDir, verify } from '../helpers'

import * as Fs from 'fs'
import * as Path from 'path'
import { describe, it } from 'node:test'
import { exec } from '../../lib'

describe('commit', () => {
  it('can commit changes', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-commit')

    await exec(['init'], testRepoPath)

    // for CI environments, no user info set - so let's stub something in the repo
    await exec(['config', 'user.email', '"test@example.com"'], testRepoPath)
    await exec(['config', 'user.name', '"Some Test User"'], testRepoPath)

    const readme = Path.join(testRepoPath, 'README.md')
    Fs.writeFileSync(readme, 'HELLO WORLD!')

    await exec(['add', 'README.md'], testRepoPath)

    const message = 'committed the README'
    const result = await exec(['commit', '-F', '-'], testRepoPath, {
      stdin: message,
    })

    verify(result, ({ exitCode, stdout }) => {
      assert.equal(exitCode, 0)
      assert.ok(stdout.includes(message), 'commit message not found in output')
    })
  })
})
