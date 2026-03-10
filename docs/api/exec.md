# `exec`

This is the easiest and safest way to work with Git. It provides a
Promise-based API that wraps the standard output, standard error and exit code
from the process, and also provides some error handling for common scenarios.

```ts
exec(args: string[], path: string, options?: IGitExecutionOptions): Promise<IGitResult>
```

 - `args` - an array of arguments that should be passed to `git` when executing
   the process
 - `path` - the directory to execute the command in
 - `options` - additional parameters to pass
    - `env`: a `Record<string, string | undefined>` of key-value pairs which are assigned to the created process
    - `stdin`: a string or `Buffer` which is written to the created process
    - `stdinEncoding`: if you need to set the encoding of the input
    - `processCallback`: a callback to inject additional code which will be
       invoked after the child process is spawned
    - `encoding`: control output encoding (`BufferEncoding` or `'buffer'`)
    - `signal`: an `AbortSignal` for cancellation support
    - `killSignal`: custom signal to use when killing the process
    - `maxBuffer`: maximum buffer size (defaults to `Infinity`)

`IGitResult` has these fields:

 - `stdout` - the standard process output from invoking Git (string or Buffer depending on `encoding`)
 - `stderr` - the standard error process output from invoking Git (string or Buffer depending on `encoding`)
 - `exitCode` - zero if the process completed without error, non-zero indicates an error

For typed results, use `IGitStringResult` (when `encoding` is a string encoding) or `IGitBufferResult` (when `encoding: 'buffer'`).

On execution failures, an `ExecError` is thrown which includes `stdout`, `stderr`, and additional properties like `code`, `signal`, and `killed`.

## Example

```ts
import { exec, IGitExecutionOptions } from 'dugite'

const path = 'C:/path/to/repo/'

const options: IGitExecutionOptions = {
  // enable diagnostics
  env: {
    'GIT_HTTP_USER_AGENT': 'dugite/3.0.0',
    'GIT_TRACE': '1',
    'GIT_CURL_VERBOSE': '1'
  },
  processCallback: (process: ChildProcess) => {
    byline(process.stderr).on('data', (chunk: string) => {
      // read line from progress and convert to percentage
    })
  }
}

const result = await exec([ 'pull', 'origin' ], path, options)
```

## Cancellation

Use `AbortController` to cancel long-running Git operations:

```ts
import { exec } from 'dugite'

const controller = new AbortController()

const resultPromise = exec(['clone', 'https://github.com/example/repo'], '/path/to/dir', {
  signal: controller.signal,
})

// Cancel if needed
controller.abort()

try {
  const result = await resultPromise
} catch (error) {
  // Handle cancellation
}
```

You can also use `AbortSignal.timeout()` for automatic cancellation:

```ts
const result = await exec(['clone', 'https://github.com/example/repo'], '/path/to/dir', {
  signal: AbortSignal.timeout(5000), // Auto-cancel after 5 seconds
})
```

