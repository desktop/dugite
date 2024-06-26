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
    it('resulting PATH contains the original PATH', () => {
      const originalPathKey = Object.keys(process.env).find(
        k => k.toUpperCase() === 'PATH'
      )
      expect(originalPathKey).not.toBeUndefined()

      const originalPathValue = process.env.PATH

      try {
        delete process.env.PATH
        process.env.Path = 'wow-such-case-insensitivity'
        // This test will ensure that on platforms where env vars names are
        // case-insensitive (like Windows) we don't end up with an invalid PATH
        // and the original one lost in the process.
        const { env } = setupEnvironment({})
        expect(env.PATH).toContain('wow-such-case-insensitivity')
      } finally {
        delete process.env.Path
        process.env[originalPathKey!] = originalPathValue
      }
    })
  }
})
