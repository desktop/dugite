# Overview

`dugite` is a wrapper on top of the Git command line interface, with some helpers to make it easy to consume in your Node applications. The important parts:

- `exec` - the core function of the library - how you interact with Git
- `spawn` - exposes the raw child process for callers to manipulate directly
- `parseError` - parse error messages from Git to detect known errors
- `IGitResult` - the abstraction for a result returned by Git - contains
  exit code and standard output/error text (which can be `string` or `Buffer`)
- `IGitExecutionOptions` - additional overrides to change the behaviour
  of `exec`
- `IGitSpawnOptions` - additional overrides to change the behaviour
  of `spawn`
- `GitError` - a collection of known error codes that `dugite` can understand
- `ExecError` - error class thrown by `exec` on execution failures, includes stdout/stderr
