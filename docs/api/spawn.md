# `GitProcess.spawn`

This method exposes the raw child process for callers to manipulate directly.
Because of this, it is the responsibility of the caller to ensure that the
child process handles success and error scenarios in their application.

```ts
GitProcess.spawn(args: string[], path: string, options?: IGitSpawnExecutionOptions): ChildProcess
```

 - `args` - an array of arguments that should be passed to `git` when executing
   the process
 - `path` - the directory to execute the command in
 - `options` - additional parameters to pass
    - `env`: a collection of key-value pairs which are assigned to the created
    process

## Example

This example mimics the Promise-based API of `GitProcess.exec` with some simple handling for the exit code:

```ts
return new Promise<string>((resolve, reject) => {
  const process = GitProcess.spawn([ 'status', '--porcelain=v2', '--untracked-files=all' ], directory)
  const output = new Array<Buffer>()
  process.stdout.on('data', (chunk) => {
    if (chunk instanceof Buffer) {
      output.push(chunk)
    } else {
      output.push(Buffer.from(chunk))
    }
  })

  process.on('exit', (code, signal) => {
    if (code !== 0) {
      reject(`process returned exit code '${code}' and signal '${signal}`)
    } else {
      const buffer = Buffer.concat(output)
      const text = buffer.toString('utf-8')
      resolve(text)
    }
  })
})
```
