import assert from 'assert'
import { GitProcess } from '../../lib'
import { gitLfsVersion } from '../helpers'
import { track } from 'temp'
import { describe, it } from 'node:test'

const temp = track()

describe('lfs', () => {
  it('can be resolved', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec(['lfs'], testRepoPath)
    assert.equal(result.exitCode, 0)
    assert.ok(
      result.stdout.includes(
        'Git LFS is a system for managing and versioning large files'
      ),
      'Expected output to include Git LFS description'
    )
  })

  it('matches the expected version', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec(['lfs', 'version'], testRepoPath)
    assert.equal(result.exitCode, 0)
    assert.ok(
      result.stdout.includes(`git-lfs/${gitLfsVersion} `),
      'Expected output to include Git LFS version'
    )
  })
})
