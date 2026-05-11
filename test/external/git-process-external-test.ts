import { describe, it } from 'node:test'
import assert from 'assert'
import { setupEnvironment } from '../../lib'
import { tmpdir } from 'os'

describe('git-process [with external Git executable]', () => {
  describe('--exec-path', () => {
    it('returns exit code when successful', async () => {
      const embedded = setupEnvironment({}, {})
      const external = setupEnvironment({ LOCAL_GIT_DIRECTORY: tmpdir() }, {})

      assert.notEqual(embedded.env.GIT_EXEC_PATH, external.env.GIT_EXEC_PATH)
      assert.notEqual(external.gitLocation, embedded.gitLocation)
    })
  })
})
