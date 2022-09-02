import { dirname } from 'path'
import { default as findGit, Git } from 'find-git-exec'

import { GitProcess } from '../../lib'
import { verify } from '../helpers'

const temp = require('temp').track()

async function setupGitEnvironment(): Promise<Git | null> {
  let git: Git | undefined = undefined

  try {
    git = await findGit()
  } catch {
    return null
  }
  if (!git || !git.path || !git.execPath) {
    return null
  } else {
    const { path, execPath } = git
    // Set the environment variable to be able to use an external Git.
    process.env.GIT_EXEC_PATH = execPath
    process.env.LOCAL_GIT_DIRECTORY = dirname(dirname(path))
    return git
  }
}

describe('git-process [with external Git executable]', () => {
  describe('clone', () => {
    it('returns exit code when successful', async () => {
      const git = await setupGitEnvironment()
      if (git == null) {
        throw new Error('External Git was not found on the host system.')
      }

      const testRepoPath = temp.mkdirSync('desktop-git-clone-valid-external')
      const result = await GitProcess.exec(
        ['clone', '--', 'https://github.com/TypeFox/find-git-exec.git', '.'],
        testRepoPath
      )
      verify(result, (r) => {
        expect(r.exitCode).toEqual(0)
      })
    })
  })
})
