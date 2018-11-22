# v2 Migration Guide

## Error parsing

`GitProcess.parseError` has moved to `parseError`, and the value returned by
`parseError` is now a string enum (previously this was a number). This should
help with improving the error handling in `dugite`, but will affect current
users if they relied on the underlying numeric values.

To help with migrating, ensure you are not comparing any error codes to their
backing value.

Instead of this:

```ts
const gitError = GitProcess.parseError(result.stderr)
const missing = gitError && gitError === 27 // value for 'NotAGitRepository'
```

Update your pre-2.0 code to compare to the enum directly:

```ts
const gitError = GitProcess.parseError(result.stderr)
const missing = gitError && gitError === GitError.NotAGitRepository
```

If you were somehow storing these values in a database, and need to convert them
into the new representation, 2.0 will ship a `migrateOldErrorCode` compatibility
function to convert to the new enum:

```ts
const oldGitError = number as GitError
const gitError = migrateOldErrorCode(oldGitError)
if (gitError !== null) {
  // update storage
} else {
  // unknown enum value
}
```

This will be deprecated shortly after, so if you have this issue:

- upgrade to the latest `1.x` release
- review all usages and ensure you are comparing to `GitError` values
- upgrade to `2.0` and update all introduced compilation errors
- update stored values to the new representation
- upgrade to latest `2.1` version, drop any remaining usage of `migrateOldErrorCode`
