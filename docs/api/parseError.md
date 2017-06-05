# `GitProcess.parseError`

Parsing error messages from Git is an essential part of detecting errors raised
by Git. `dugite` comes with a collection of known errors, and you can
pass the standard error output from your process to see if it maps to known
error messages.

For example:

```ts
const result = await GitProcess.exec([ 'pull', 'origin', branch ], path, options)
if (result.exitCode !== 0) {
  const error = GitProcess.parseError(result.stderr)
  if (error) {
    if (error === GitError.HTTPSAuthenticationFailed) {
      // invalid credentials
    }
    // TODO: other scenarios
  }
}
```
