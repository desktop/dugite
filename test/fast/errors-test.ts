import { GitProcess, GitError } from '../../lib'
import { verify, initialize } from '../helpers'

describe('detects errors', () => {
  it('RemoteAlreadyExists', async () => {
    const repoPath = await initialize('remote-already-exists-test-repo')

    await GitProcess.exec(['remote', 'add', 'new-remote', 'https://github.com'], repoPath)

    const result = await GitProcess.exec(
      ['remote', 'add', 'new-remote', 'https://gitlab.com'],
      repoPath
    )

    verify(result, r => {
      expect(GitProcess.parseError(r.stderr)).toBe(GitError.RemoteAlreadyExists)
    })
  })
})
