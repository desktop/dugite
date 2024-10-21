import assert from 'node:assert'
import { exec } from '../../lib'
import { gitCredentialManagerVersion } from '../helpers'
import { describe, it } from 'node:test'

describe('git-credential-manager', () => {
  it('matches the expected version', async () => {
    const result = await exec(
      ['credential-manager', '--version'],
      process.cwd()
    )
    assert.equal(result.exitCode, 0)
    assert.ok(result.stdout.startsWith(gitCredentialManagerVersion))
  })
})
