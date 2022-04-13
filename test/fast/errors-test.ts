import { GitProcess, GitError } from '../../lib'
import { initialize } from '../helpers'
import { writeFileSync } from 'fs'
import { join } from 'path'

describe('detects errors', () => {
  it('RemoteAlreadyExists', async () => {
    const repoPath = await initialize('remote-already-exists-test-repo')

    await GitProcess.exec(['remote', 'add', 'new-remote', 'https://github.com'], repoPath)

    const result = await GitProcess.exec(
      ['remote', 'add', 'new-remote', 'https://gitlab.com'],
      repoPath
    )

    expect(result).toHaveGitError(GitError.RemoteAlreadyExists)
  })
  it('TagAlreadyExists', async () => {
    const repoPath = await initialize('tag-already-exists-test-repo')
    const filePath = 'text.md'

    writeFileSync(join(repoPath, filePath), 'some text')
    await GitProcess.exec(['add', filePath], repoPath)
    await GitProcess.exec(['commit', '-m', 'add a text file'], repoPath)

    await GitProcess.exec(['tag', 'v0.1'], repoPath)

    // try to make the same tag again
    const result = await GitProcess.exec(['tag', 'v0.1'], repoPath)

    expect(result).toHaveGitError(GitError.TagAlreadyExists)
  })
  it('BranchAlreadyExists', async () => {
    const path = await initialize('branch-already-exists', 'foo')
    await GitProcess.exec(['commit', '-m', 'initial', '--allow-empty'], path)

    const result = await GitProcess.exec(['branch', 'foo'], path)

    expect(result).toHaveGitError(GitError.BranchAlreadyExists)
  })
})
