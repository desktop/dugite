import { GitProcess } from '../../lib'
import { gitCredentialManagerVersion } from '../helpers'

describe('git-credential-manager', () => {
  it(
    'matches the expected version',
    async () => {
      const result = await GitProcess.exec(
        ['credential-manager', '--version'],
        process.cwd()
      )
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain(gitCredentialManagerVersion)
    },
    30 * 1000
  )
})
