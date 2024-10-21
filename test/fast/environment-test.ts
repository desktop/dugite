import { GitProcess } from '../../lib'
import { setupEnvironment } from '../../lib/git-environment'

const temp = require('temp').track()

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
    expect(result.stdout).toBe('Foo Bar <foo@bar.com> 1475703207 +0200\n')
  })

  it('when GIT_EXEC_PATH environment variable is *not* set, it will be calculated', async () => {
    expect(process.env.GIT_EXEC_PATH).toBeUndefined()
    const { env } = await setupEnvironment({})
    expect((<any>env)['GIT_EXEC_PATH']).not.toBeUndefined()
  })

  it('when GIT_EXEC_PATH environment variable is set, that will be used as is', async () => {
    expect(process.env.GIT_EXEC_PATH).toBeUndefined()
    try {
      process.env.GIT_EXEC_PATH = __filename
      const { env } = await setupEnvironment({})
      expect((<any>env)['GIT_EXEC_PATH']).toBe(__filename)
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
      expect(env.PATH).toBeUndefined()
      expect(env.path).toContain('custom-path')
    })
  } else {
    it('treats environment variables as case-sensitive', () => {
      const { env } = setupEnvironment(
        { PATH: 'WOW_SUCH_CASE_SENSITIVITY' },
        { path: 'wow-such-case-sensitivity' }
      )
      expect(env.PATH).toBe('WOW_SUCH_CASE_SENSITIVITY')
      expect(env.path).toBe('wow-such-case-sensitivity')
    })
  }
})
