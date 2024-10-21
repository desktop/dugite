import { resolve } from 'path'
import findGit from 'find-git-exec'

import { verify } from '../helpers'
import { track } from 'temp'
import { describe, it } from 'node:test'
import assert from 'assert'
import { exec } from '../../lib'

const temp = track()

const getExternalGitEnvironment = () =>
  findGit().then(({ path, execPath }) => ({
    GIT_EXEC_PATH: execPath,
    LOCAL_GIT_DIRECTORY: resolve(path, '../../'),
  }))

describe('git-process [with external Git executable]', () => {
  describe('--exec-path', () => {
    it('returns exit code when successful', async () => {
      const env = await getExternalGitEnvironment()

      const testRepoPath = temp.mkdirSync('desktop-git-clone-valid-external')
      const result = await exec(['--exec-path'], testRepoPath, {
        env,
      })

      verify(result, r => assert.equal(r.exitCode, 0))
      verify(result, r =>
        assert.equal(resolve(r.stdout.trim()), resolve(env.GIT_EXEC_PATH))
      )
    })
  })
})
