import assert from 'assert'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { describe, it } from 'node:test'
import { exec, GitError, parseError } from '../../lib'
import { assertHasGitError, initialize } from '../helpers'

async function git(repoPath: string, args: string[]) {
  const result = await exec(args, repoPath)
  assert.strictEqual(result.exitCode, 0, result.stderr)
  return result
}

async function commitFile(repoPath: string, contents: string) {
  await writeFile(join(repoPath, 'file.txt'), contents)
  await git(repoPath, ['add', 'file.txt'])
  await git(repoPath, ['commit', '-m', 'Update file'])
}

describe('current Git error detection', () => {
  it('detects a branch rename failing on an existing ref namespace', async t => {
    const repoPath = await initialize(t, 'rename-error', 'main')
    await git(repoPath, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await git(repoPath, ['branch', 'new/child'])

    const result = await exec(['branch', '-m', 'main', 'new'], repoPath)

    assert.notStrictEqual(result.exitCode, 0)
    assertHasGitError(result, GitError.BranchRenameFailed)
  })

  for (const noCommit of [false, true]) {
    it(`detects revert conflicts with no-commit=${noCommit}`, async t => {
      const repoPath = await initialize(t, 'revert-error')
      await commitFile(repoPath, 'base\n')
      await commitFile(repoPath, 'change\n')
      await commitFile(repoPath, 'later\n')

      const result = await exec(
        [
          '-c',
          'advice.mergeConflict=true',
          '-c',
          'color.advice=false',
          'revert',
          ...(noCommit ? ['--no-commit'] : ['--no-edit']),
          'HEAD~',
        ],
        repoPath
      )

      assert.notStrictEqual(result.exitCode, 0)
      assertHasGitError(result, GitError.RevertConflicts)
      assert.strictEqual(parseError(result.stderr), GitError.RevertConflicts)
      assert.strictEqual(parseError(result.stdout), GitError.MergeConflicts)
      for (const output of [
        result.stderr + result.stdout,
        result.stdout + result.stderr,
      ]) {
        assert.strictEqual(parseError(output), GitError.RevertConflicts)
      }
    })
  }

  for (const command of ['rebase', 'pull'] as const) {
    for (const changes of ['unstaged', 'staged', 'both'] as const) {
      it(`detects ${command} with ${changes} changes`, async t => {
        const repoPath = await initialize(t, 'dirty-rebase-error', 'main')
        await commitFile(repoPath, 'base\n')
        await writeFile(join(repoPath, 'file.txt'), 'staged\n')
        if (changes !== 'unstaged') {
          await git(repoPath, ['add', 'file.txt'])
        }
        if (changes === 'both') {
          await writeFile(join(repoPath, 'file.txt'), 'unstaged\n')
        }

        const result = await exec(
          [
            '-c',
            'rebase.autoStash=false',
            '-c',
            'pull.autoStash=false',
            ...(command === 'rebase'
              ? ['rebase', 'main']
              : ['pull', '--rebase', '.', 'main']),
          ],
          repoPath
        )

        assert.notStrictEqual(result.exitCode, 0)
        assertHasGitError(result, GitError.RebaseWithLocalChanges)
      })
    }
  }

  for (const branch of ['branch', 'Branch']) {
    it(`accepts ${branch} rename failure capitalization`, () => {
      assert.strictEqual(
        parseError(`fatal: ${branch} rename failed`),
        GitError.BranchRenameFailed
      )
    })
  }

  const revertAdvice = [
    "hint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'",
    "hint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'",
    'hint: After resolving the conflicts, mark them with\nhint: "git add/rm <pathspec>", then run\nhint: "git revert --continue".',
  ]

  for (const [index, advice] of revertAdvice.entries()) {
    for (const newline of ['\n', '\r\n']) {
      it(`accepts revert advice variant ${index} with ${JSON.stringify(newline)}`, () => {
        const output =
          `error: could not revert abc1234... Update file\n${advice}\n`.replace(
            /\n/g,
            newline
          )
        assert.strictEqual(parseError(output), GitError.RevertConflicts)
        assert.strictEqual(
          parseError(
            `CONFLICT (content): Merge conflict in file.txt\n${output}`
          ),
          GitError.RevertConflicts
        )
      })
    }
  }

  for (const command of ['rebase', 'pull with rebase']) {
    for (const please of ['Please', 'please']) {
      it(`preserves ${command} advice with ${please}`, () => {
        assert.strictEqual(
          parseError(
            `error: cannot ${command}: You have unstaged changes.\nerror: ${please} commit or stash them.`
          ),
          GitError.RebaseWithLocalChanges
        )
      })
    }
  }

  it('preserves rebase conflict priority over generic merge conflicts', () => {
    assert.strictEqual(
      parseError(
        'CONFLICT (content): Merge conflict in file.txt\nhint: Resolve all conflicts manually, mark them as resolved with\n'
      ),
      GitError.RebaseConflicts
    )
  })

  for (const output of [
    'fatal: branch copy failed',
    'fatal: no branch named missing',
    'error: could not revert abc1234... Update file\nfatal: unable to write new index file',
    'error: could not apply abc1234... Update file\n' + revertAdvice[2],
    'error: could not revert abc1234... Update file\n' +
      revertAdvice[2].replace(
        'git revert --continue',
        'git cherry-pick --continue'
      ),
    'error: cannot rebase: could not read HEAD\nerror: Please commit or stash them.',
    'error: cannot merge: Your index contains uncommitted changes.\nerror: Please commit or stash them.',
    'error: cannot rebase: You have unstaged changes.\nerror: unrelated failure\nerror: Please commit or stash them.',
  ]) {
    it(`does not misclassify ${JSON.stringify(output)}`, () => {
      assert.strictEqual(parseError(output), null)
    })
  }
})
