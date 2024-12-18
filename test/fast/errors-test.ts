import { exec, GitError, parseBadConfigValueErrorInfo } from '../../lib'
import { assertHasGitError, initialize } from '../helpers'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { GitErrorRegexes } from '../../lib/errors'
import assert from 'assert'
import { describe, it } from 'node:test'

describe('detects errors', () => {
  it('RemoteAlreadyExists', async t => {
    const repoPath = await initialize(t, 'remote-already-exists-test-repo')

    await exec(['remote', 'add', 'new-remote', 'https://github.com'], repoPath)

    const result = await exec(
      ['remote', 'add', 'new-remote', 'https://gitlab.com'],
      repoPath
    )

    assertHasGitError(result, GitError.RemoteAlreadyExists)
  })
  it('TagAlreadyExists', async t => {
    const repoPath = await initialize(t, 'tag-already-exists-test-repo')
    const filePath = 'text.md'

    writeFileSync(join(repoPath, filePath), 'some text')
    await exec(['add', filePath], repoPath)
    await exec(['commit', '-m', 'add a text file'], repoPath)

    await exec(['tag', 'v0.1'], repoPath)

    // try to make the same tag again
    const result = await exec(['tag', 'v0.1'], repoPath)

    assertHasGitError(result, GitError.TagAlreadyExists)
  })
  it('BranchAlreadyExists', async t => {
    const path = await initialize(t, 'branch-already-exists', 'foo')
    await exec(['commit', '-m', 'initial', '--allow-empty'], path)

    const result = await exec(['branch', 'foo'], path)

    assertHasGitError(result, GitError.BranchAlreadyExists)
  })
  it('UnsafeDirectory', async t => {
    const repoName = 'branch-already-exists'
    const path = await initialize(t, repoName)

    const result = await exec(['status'], path, {
      env: {
        GIT_TEST_ASSUME_DIFFERENT_OWNER: '1',
      },
    })

    assertHasGitError(result, GitError.UnsafeDirectory)

    const errorEntry = Object.entries(GitErrorRegexes).find(
      ([_, v]) => v === GitError.UnsafeDirectory
    )

    assert.notEqual(errorEntry, null)
    const m = result.stderr.match(errorEntry![0])

    // toContain because of realpath and we don't care about /private/ on macOS
    assert.ok(m![1].includes(repoName), 'repo name not found in error message')
  })
  describe('BadConfigValue', () => {
    it('detects bad boolean config value', async t => {
      const repoPath = await initialize(t, 'bad-config-repo')

      const filePath = 'text.md'
      writeFileSync(join(repoPath, filePath), 'some text')
      await exec(['add', filePath], repoPath)

      await exec(['config', 'core.autocrlf', 'nab'], repoPath)

      const result = await exec(['commit', '-m', 'add a text file'], repoPath)

      assertHasGitError(result, GitError.BadConfigValue)

      const errorInfo = parseBadConfigValueErrorInfo(result.stderr)
      assert.notEqual(errorInfo, null)
      assert.equal(errorInfo!.value, 'nab')
      assert.equal(errorInfo!.key, 'core.autocrlf')
    })
    it('detects bad numeric config value', async t => {
      const repoPath = await initialize(t, 'bad-config-repo')

      const filePath = 'text.md'
      writeFileSync(join(repoPath, filePath), 'some text')
      await exec(['add', filePath], repoPath)

      await exec(['config', 'core.repositoryformatversion', 'nan'], repoPath)

      const result = await exec(['commit', '-m', 'add a text file'], repoPath)

      assertHasGitError(result, GitError.BadConfigValue)

      const errorEntry = Object.entries(GitErrorRegexes).find(
        ([_, v]) => v === GitError.BadConfigValue
      )

      assert.notEqual(errorEntry, null)
      const m = result.stderr.match(errorEntry![0])

      assert.equal(m![1], 'nan')
      assert.equal(m![2], 'core.repositoryformatversion')
    })
  })
})
