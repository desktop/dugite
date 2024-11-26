import assert from 'assert'
import { setupEnvironment } from '../../lib/git-environment'
import { describe, it } from 'node:test'
import { exec } from '../../lib'
import { createTestDir } from '../helpers'

describe('environment variables', () => {
  it('can set them', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-test-environment')
    const result = await exec(['var', 'GIT_AUTHOR_IDENT'], testRepoPath, {
      env: {
        GIT_AUTHOR_NAME: 'Foo Bar',
        GIT_AUTHOR_EMAIL: 'foo@bar.com',
        GIT_AUTHOR_DATE: 'Wed, 05 Oct 2016 23:33:27 +0200',
      },
    })
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
    it('preserves case of path environment', () => {
      const { env } = setupEnvironment(
        { PATH: 'custom-path' },
        { path: 'env-path' }
      )
      assert.equal(env.PATH, undefined)
      assert.ok(env.path?.includes('custom-path'))
    })
  } else {
    it('treats environment variables as case-sensitive', () => {
      const { env } = setupEnvironment(
        { PATH: 'WOW_SUCH_CASE_SENSITIVITY' },
        { path: 'wow-such-case-sensitivity' }
      )
      assert.equal(env.PATH, 'WOW_SUCH_CASE_SENSITIVITY')
      assert.equal(env.path, 'wow-such-case-sensitivity')
    })
  }
})
