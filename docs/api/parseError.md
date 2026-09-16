# `parseError`

Parsing error messages from Git is an essential part of detecting errors raised
by Git. `dugite` comes with a collection of known errors, and you can
pass the standard error output from your process to see if it maps to known
error messages.

The first matching pattern determines the returned `GitError`; if no pattern
matches, the result is `null`. More specific conflict patterns for rebase and
revert take precedence over generic merge-conflict output.

Revert conflict detection accepts both current and legacy conflict advice,
including `git revert --no-commit`. It still requires the conflict advice, rather
than treating every failed revert as a conflict. Rebase and pull-with-rebase
checks recognize unstaged changes, staged changes, or both.

For example:

```ts
import { exec, parseError, GitError } from 'dugite'

const result = await exec([ 'pull', 'origin', branch ], path, options)
if (result.exitCode !== 0) {
  const error = parseError(result.stderr)
  if (error) {
    if (error === GitError.HTTPSAuthenticationFailed) {
      // invalid credentials
    }
    // TODO: other scenarios
  }
}
```
