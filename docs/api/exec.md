# `GitProcess.exec`

This is the easiest and safest way to work with Git. It provides a
Promise-based API that wraps the standard output, standard error and exit code
from the process, and also provides some error handling for common scenarios.

```ts
GitProcess.exec(args: string[], path: string, options?: IGitExecutionOptions):Promise<IGitResult>
```

 - `args` - an array of arguments that should be passed to `git` when executing
   the process
 - `path` - the directory to execute the command in
 - `options` - additional parameters to pass
    - `env`: a collection of key-value pairs which are assigned to the created
    process
    - `stdin`: a string or `Buffer` which is written to the created process
    - `stdinEncoding`: if you need to set the encoding of the input
    - `processCallback`: a callback to inject additional code which will be
       invoked after the child process is spawned

`IGitResult` has these fields:

 - `stdout` - a string representing the standard process output from invoking Git
 - `stderr` - a string representing the standard error process output from invoking Git
 - `exitCode` - zero if the process completed without error, non-zero indicates an error

## Example

```ts
const path = 'C:/path/to/repo/'

const options: IGitExecutionOptions = {
  // enable diagnostics
  env: {
    'GIT_HTTP_USER_AGENT': 'dugite/2.12.0',
    'GIT_TRACE': '1',
    'GIT_CURL_VERBOSE': '1'
  },
  processCallback: (process: ChildProcess) => {
    byline(process.stderr).on('data', (chunk: string) => {
      // read line from progress and convert to percentage
    })
  }
}

const result = await GitProcess.exec([ 'pull', 'origin' ], path, options)
```

