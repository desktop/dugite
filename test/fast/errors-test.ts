import { GitProcess, GitError } from '../../lib'
import { initialize } from '../helpers'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { GitErrorRegexes } from '../../lib/errors'

describe('detects errors', () => {
  it('RemoteAlreadyExists', async () => {
    const repoPath = await initialize('remote-already-exists-test-repo')

    await GitProcess.exec(
      ['remote', 'add', 'new-remote', 'https://github.com'],
      repoPath
    )

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
  it('UnsafeDirectory', async () => {
    const repoName = 'branch-already-exists'
    const path = await initialize(repoName)

    const result = await GitProcess.exec(['status'], path, {
      env: {
        GIT_TEST_ASSUME_DIFFERENT_OWNER: '1',
      },
    })

    expect(result).toHaveGitError(GitError.UnsafeDirectory)

    const errorEntry = Object.entries(GitErrorRegexes).find(
      ([_, v]) => v === GitError.UnsafeDirectory
    )

    expect(errorEntry).not.toBe(null)
    const m = result.stderr.match(errorEntry![0])

    // toContain because of realpath and we don't care about /private/ on macOS
    expect(m![1]).toContain(repoName)
  })
  describe('BadConfigValue', () => {
    it('detects bad boolean config value', async () => {
      const repoPath = await initialize('bad-config-repo')

      const filePath = 'text.md'
      writeFileSync(join(repoPath, filePath), 'some text')
      await GitProcess.exec(['add', filePath], repoPath)

      await GitProcess.exec(['config', 'core.autocrlf', 'nab'], repoPath)

      const result = await GitProcess.exec(
        ['commit', '-m', 'add a text file'],
        repoPath
      )

      expect(result).toHaveGitError(GitError.BadConfigValue)

      const errorInfo = GitProcess.parseBadConfigValueErrorInfo(result.stderr)
      expect(errorInfo).not.toBe(null)
      expect(errorInfo!.value).toBe('nab')
      expect(errorInfo!.key).toBe('core.autocrlf')
    })
    it('detects bad numeric config value', async () => {
      const repoPath = await initialize('bad-config-repo')

      const filePath = 'text.md'
      writeFileSync(join(repoPath, filePath), 'some text')
      await GitProcess.exec(['add', filePath], repoPath)

      await GitProcess.exec(
        ['config', 'core.repositoryformatversion', 'nan'],
        repoPath
      )

      const result = await GitProcess.exec(
        ['commit', '-m', 'add a text file'],
        repoPath
      )

      expect(result).toHaveGitError(GitError.BadConfigValue)

      const errorEntry = Object.entries(GitErrorRegexes).find(
        ([_, v]) => v === GitError.BadConfigValue
      )

      expect(errorEntry).not.toBe(null)
      const m = result.stderr.match(errorEntry![0])

      expect(m![1]).toBe('nan')
      expect(m![2]).toBe('core.repositoryformatversion')
    })
  })
})
