import * as chai from 'chai'
const expect = chai.expect

import * as path from 'path'
import { GitProcess, GitError } from '../lib'

const temp = require('temp').track()

describe('git-process', () => {
  it('can launch git', async () => {
    const result = await GitProcess.exec([ '--version' ], __dirname)
    expect(result.stdout.length).to.be.greaterThan(0)
  })

  it('returns exit code when folder is empty', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
    const result = await GitProcess.exec([ 'show', 'HEAD' ], testRepoPath)
    expect(result.exitCode).to.equal(128)
  })

  it('raises error when folder does not exist', async () => {
    const testRepoPath = path.join(temp.path(), 'desktop-does-not-exist')

    let error: Error | null = null
    try {
      await GitProcess.exec([ 'show', 'HEAD' ], testRepoPath)
    } catch (e) {
      error = e
    }

    expect(error!.message).to.equal('Unable to find path to repository on disk.')
  })

  it('can parse errors', () => {
    const error = GitProcess.parseError('fatal: Authentication failed')
    expect(error).to.equal(GitError.SSHAuthenticationFailed)
  })

  describe('stdin', () => {

    it('can write large buffers', async () => {
      // Allocate 10Mb of memory
      const buffer = Buffer.alloc(1024 * 1024 * 10)

      // Ensure it's all filled with zeroes
      buffer.fill(0)

      const testRepoPath = temp.mkdirSync('desktop-git-test-large-input')

      // Hash the object (without writing it to object database)
      const result = await GitProcess.exec([ 'hash-object', '--stdin' ], testRepoPath, { stdin: buffer })

      // Ensure that 10Mb of zeroes hashes correctly
      expect(result.stdout).to.equal('6c5d4031e03408e34ae476c5053ee497a91ac37b\n')
    })

    it('can write strings', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-input-string')

      // Hash the object (without writing it to object database)
      const result = await GitProcess.exec([ 'hash-object', '--stdin' ], testRepoPath, {
        stdin: 'foo bar'
      })

      expect(result.stdout).to.equal('96c906756d7b91c45322617c9295e4a80d52d1c5\n')
    })

    it('can write strings with encoding', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-input-string')

      // Hash the object (without writing it to object database)
      const result1 = await GitProcess.exec([ 'hash-object', '--stdin' ], testRepoPath, {
        stdin: 'åäö',
        stdinEncoding: 'utf-8'
      })

      expect(result1.stdout).to.equal('3889b04ced1aef334c8caaa923559abba286394e\n')

      // Hash the object (without writing it to object database)
      const result2 = await GitProcess.exec([ 'hash-object', '--stdin' ], testRepoPath, {
        stdin: 'åäö',
        stdinEncoding: 'ascii'
      })

      expect(result2.stdout).to.equal('652b06b434a5750d876f9eb55c07c0f1fab93464\n')
    })

    it('assumes utf-8 for stdin by default', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-input-string')

      // Hash the object (without writing it to object database)
      const result = await GitProcess.exec([ 'hash-object', '--stdin' ], testRepoPath, {
        stdin: 'åäö',
      })

      expect(result.stdout).to.equal('3889b04ced1aef334c8caaa923559abba286394e\n')
    })
  })
})
