import assert from 'assert'
import { createTestDir, gitLfsVersion } from '../helpers'
import { describe, it } from 'node:test'
import { exec } from '../../lib'

describe('lfs', () => {
  it('can be resolved', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-lfs')
    const result = await exec(['lfs'], testRepoPath)
    assert.equal(result.exitCode, 0)
    assert.ok(
      result.stdout.includes(
        'Git LFS is a system for managing and versioning large files'
      ),
      'Expected output to include Git LFS description'
    )
  })

  it('matches the expected version', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-lfs')
    const result = await exec(['lfs', 'version'], testRepoPath)
    assert.equal(result.exitCode, 0)
    assert.ok(
      result.stdout.includes(`git-lfs/${gitLfsVersion} `),
      'Expected output to include Git LFS version'
    )
  })
})
