import assert from 'assert'
import { GitProcess } from '../../lib'
import { setupEnvironment } from '../../lib/git-environment'
import { track } from 'temp'
import { describe, it } from 'node:test'

const temp = track()

describe('environment variables', () => {
  it('can set them', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-environment')
    const result = await GitProcess.exec(
      ['var', 'GIT_AUTHOR_IDENT'],
      testRepoPath,
      {
        env: {
          GIT_AUTHOR_NAME: 'Foo Bar',
          GIT_AUTHOR_EMAIL: 'foo@bar.com',
          GIT_AUTHOR_DATE: 'Wed, 05 Oct 2016 23:33:27 +0200',
        },
      }
    )
    assert.equal(result.stdout, 'Foo Bar <foo@bar.com> 1475703207 +0200\n')
  })

  it('when GIT_EXEC_PATH environment variable is *not* set, it will be calculated', async () => {
    assert.equal(process.env.GIT_EXEC_PATH, undefined)
    const { env } = setupEnvironment({})
    assert.ok(env['GIT_EXEC_PATH'])
  })

  it('when GIT_EXEC_PATH environment variable is set, that will be used as is', async () => {
    assert.equal(process.env.GIT_EXEC_PATH, undefined)
    try {
      process.env.GIT_EXEC_PATH = __filename
      const { env } = setupEnvironment({})
      assert.equal(env['GIT_EXEC_PATH'], __filename)
    } finally {
      delete process.env.GIT_EXEC_PATH
    }
  })

  if (process.platform === 'win32') {
    it('resulting PATH contains the original PATH', () => {
      const originalPathKey = Object.keys(process.env).find(
        k => k.toUpperCase() === 'PATH'
      )
      assert.notEqual(originalPathKey, undefined)

      const originalPathValue = process.env.PATH

      try {
        delete process.env.PATH
        process.env.Path = 'wow-such-case-insensitivity'
        // This test will ensure that on platforms where env vars names are
        // case-insensitive (like Windows) we don't end up with an invalid PATH
        // and the original one lost in the process.
        const { env } = setupEnvironment({})
        assert.ok(env.PATH?.includes('wow-such-case-insensitivity'))
      } finally {
        delete process.env.Path
        process.env[originalPathKey!] = originalPathValue
      }
    })
  }
})
