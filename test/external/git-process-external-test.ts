import { resolve } from 'path'
import findGit from 'find-git-exec'

import { GitProcess } from '../../lib'
import { verify } from '../helpers'
import { track } from 'temp'

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
      const result = await GitProcess.exec(['--exec-path'], testRepoPath, {
        env,
      })

      verify(result, r => expect(r.exitCode).toEqual(0))
      verify(result, r =>
        expect(resolve(r.stdout.trim())).toEqual(resolve(env.GIT_EXEC_PATH))
      )
    })
  })
})
