import assert from 'assert'
import { describe, it } from 'node:test'
import { exec } from '../../lib'
import { createTestDir } from '../helpers'

describe('stdin', () => {
  it('can write large buffers', async t => {
    // Allocate 10Mb of memory
    const buffer = Buffer.alloc(1024 * 1024 * 10)

    // Ensure it's all filled with zeroes
    buffer.fill(0)

    const testRepoPath = await createTestDir(t, 'desktop-git-test-large-input')

    // Hash the object (without writing it to object database)
    const result = await exec(['hash-object', '--stdin'], testRepoPath, {
      stdin: buffer,
    })

    // Ensure that 10Mb of zeroes hashes correctly
    assert.equal(result.stdout, '6c5d4031e03408e34ae476c5053ee497a91ac37b\n')
  })

  it('can write strings', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-input-string')

    // Hash the object (without writing it to object database)
    const result = await exec(['hash-object', '--stdin'], testRepoPath, {
      stdin: 'foo bar',
    })

    assert.equal(result.stdout, '96c906756d7b91c45322617c9295e4a80d52d1c5\n')
  })

  it('can write strings with encoding', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-input-string')

    // Hash the object (without writing it to object database)
    const result1 = await exec(['hash-object', '--stdin'], testRepoPath, {
      stdin: 'åäö',
      stdinEncoding: 'utf-8',
    })

    assert.equal(result1.stdout, '3889b04ced1aef334c8caaa923559abba286394e\n')

    // Hash the object (without writing it to object database)
    const result2 = await exec(['hash-object', '--stdin'], testRepoPath, {
      stdin: 'åäö',
      stdinEncoding: 'ascii',
    })

    assert.equal(result2.stdout, '652b06b434a5750d876f9eb55c07c0f1fab93464\n')
  })

  it('assumes utf-8 for stdin by default', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-input-string')

    // Hash the object (without writing it to object database)
    const result = await exec(['hash-object', '--stdin'], testRepoPath, {
      stdin: 'åäö',
    })

    assert.equal(result.stdout, '3889b04ced1aef334c8caaa923559abba286394e\n')
  })
})
