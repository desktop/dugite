import * as fs from 'fs'
import { kill } from 'process'

import { execFile, spawn } from 'child_process'
import {
  GitError,
  GitErrorRegexes,
  RepositoryDoesNotExistErrorCode,
  GitNotFoundErrorCode,
} from './errors'
import { ChildProcess } from 'child_process'

import { setupEnvironment } from './git-environment'

export interface IGitResult {
  /** The standard output from git. */
  readonly stdout: string | Buffer

  /** The standard error output from git. */
  readonly stderr: string | Buffer

  /** The exit code of the git process. */
  readonly exitCode: number
}

/** The result of shelling out to git using a string encoding (default) */
export interface IGitStringResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: string

  /** The standard error output from git. */
  readonly stderr: string
}

/** The result of shelling out to git using a buffer encoding */
export interface IGitBufferResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: Buffer

  /** The standard error output from git. */
  readonly stderr: Buffer
}

/**
 * A set of configuration options that can be passed when
 * executing a streaming Git command.
 */
export interface IGitSpawnExecutionOptions {
  /**
   * An optional collection of key-value pairs which will be
   * set as environment variables before executing the git
   * process.
   */
  readonly env?: Record<string, string | undefined>
}

/**
 * A set of configuration options that can be passed when
 * executing a git command.
 */
export interface IGitExecutionOptions {
  /**
   * An optional collection of key-value pairs which will be
   * set as environment variables before executing the git
   * process.
   */
  readonly env?: Record<string, string | undefined>

  /**
   * An optional string or buffer which will be written to
   * the child process stdin stream immediately immediately
   * after spawning the process.
   */
  readonly stdin?: string | Buffer

  /**
   * The encoding to use when writing to stdin, if the stdin
   * parameter is a string.
   */
  readonly stdinEncoding?: BufferEncoding

  /**
   * The encoding to use when decoding the stdout and stderr output. Defaults to
   * 'utf8'.
   */
  readonly encoding?: BufferEncoding | 'buffer'

  /**
   * The size the output buffer to allocate to the spawned process. Set this
   * if you are anticipating a large amount of output.
   *
   * If not specified, this will be 10MB (10485760 bytes) which should be
   * enough for most Git operations.
   */
  readonly maxBuffer?: number

  /**
   * An optional callback which will be invoked with the child
   * process instance after spawning the git process.
   *
   * Note that if the stdin parameter was specified the stdin
   * stream will be closed by the time this callback fires.
   */
  readonly processCallback?: (process: ChildProcess) => void
}

interface IGitStringExecutionOptions extends IGitExecutionOptions {
  readonly encoding?: BufferEncoding
}

interface IGitBufferExecutionOptions extends IGitExecutionOptions {
  readonly encoding: 'buffer'
}

/**
 * The errors coming from `execFile` have a `code` and we wanna get at that
 * without resorting to `any` casts.
 */
interface ErrorWithCode extends Error {
  code: string | number | undefined
}

export class GitProcess {
  private static pathExists(path: string): Boolean {
    try {
      fs.accessSync(path, (fs as any).F_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Execute a command and interact with the process outputs directly.
   *
   * The returned promise will reject when the git executable fails to launch,
   * in which case the thrown Error will have a string `code` property. See
   * `errors.ts` for some of the known error codes.
   */
  public static spawn(
    args: string[],
    path: string,
    options?: IGitSpawnExecutionOptions
  ): ChildProcess {
    let customEnv = {}
    if (options && options.env) {
      customEnv = options.env
    }

    const { env, gitLocation } = setupEnvironment(customEnv)

    const spawnArgs = {
      env,
      cwd: path,
    }

    const spawnedProcess = spawn(gitLocation, args, spawnArgs)

    ignoreClosedInputStream(spawnedProcess)

    return spawnedProcess
  }

  /**
   * Execute a command and read the output using the embedded Git environment.
   *
   * The returned promise will reject when the git executable fails to launch,
   * in which case the thrown Error will have a string `code` property. See
   * `errors.ts` for some of the known error codes.
   *
   * See the result's `stderr` and `exitCode` for any potential git error
   * information.
   */
  public static exec(
    args: string[],
    path: string,
    options?: IGitStringExecutionOptions
  ): Promise<IGitStringResult>
  public static exec(
    args: string[],
    path: string,
    options?: IGitBufferExecutionOptions
  ): Promise<IGitBufferResult>
  public static exec(
    args: string[],
    path: string,
    options?: IGitExecutionOptions
  ): Promise<IGitResult> {
    return this.execTask(args, path, options).result
  }

  /**
   * Execute a command and read the output using the embedded Git environment.
   *
   * The returned GitTask will will contain `result`, `setPid`, `cancel`
   * `result` will be a promise, which will reject when the git
   * executable fails to launch, in which case the thrown Error will
   * have a string `code` property. See `errors.ts` for some of the
   * known error codes.
   * See the result's `stderr` and `exitCode` for any potential git error
   * information.
   *
   * As for, `setPid(pid)`, this is to set the PID
   *
   * And `cancel()` will try to cancel the git process
   */
  public static execTask(
    args: string[],
    path: string,
    options?: IGitStringExecutionOptions
  ): IGitTask<IGitStringResult>
  public static execTask(
    args: string[],
    path: string,
    options?: IGitBufferExecutionOptions
  ): IGitTask<IGitBufferResult>
  public static execTask(
    args: string[],
    path: string,
    options?: IGitExecutionOptions
  ): IGitTask<IGitResult>
  public static execTask(
    args: string[],
    path: string,
    options?: IGitExecutionOptions
  ): IGitTask<IGitResult> {
    let pidResolve: {
      (arg0: any): void
      (value: number | PromiseLike<number | undefined> | undefined): void
    }
    const pidPromise = new Promise<undefined | number>(function (resolve) {
      pidResolve = resolve
    })

    let result = new GitTask(
      new Promise<IGitResult>(function (resolve, reject) {
        let customEnv = {}
        if (options && options.env) {
          customEnv = options.env
        }

        const { env, gitLocation } = setupEnvironment(customEnv)

        // This is the saddest hack. There's a bug in the types for execFile
        // (ExecFileOptionsWithBufferEncoding is the exact same as
        // ExecFileOptionsWithStringEncoding) so we can't get TS to pick the
        // execFile overload that types stdout/stderr as buffer by setting
        // the encoding to 'buffer'. So we'll do this ugly where we pretend
        // it'll only ever be a valid encoding or 'null' (which isn't true).
        //
        // This will trick TS to pick the ObjectEncodingOptions overload of
        // ExecFile which correctly types stderr/stdout as Buffer | string.
        //
        // Some day someone with more patience than me will contribute an
        // upstream fix to DefinitelyTyped and we can remove this. It's
        // essentially https://github.com/DefinitelyTyped/DefinitelyTyped/pull/67202
        // but for execFile.
        const encoding = (options?.encoding ?? 'utf8') as BufferEncoding | null
        const maxBuffer = options ? options.maxBuffer : 10 * 1024 * 1024

        const spawnedProcess = execFile(
          gitLocation,
          args,
          { cwd: path, encoding, maxBuffer, env },
          function (err, stdout, stderr) {
            result.updateProcessEnded()

            if (!err) {
              resolve({ stdout, stderr, exitCode: 0 })
              return
            }

            const errWithCode = err as ErrorWithCode

            let code = errWithCode.code

            // If the error's code is a string then it means the code isn't the
            // process's exit code but rather an error coming from Node's bowels,
            // e.g., ENOENT.
            if (typeof code === 'string') {
              if (code === 'ENOENT') {
                let message = err.message
                if (GitProcess.pathExists(path) === false) {
                  message = 'Unable to find path to repository on disk.'
                  code = RepositoryDoesNotExistErrorCode
                } else {
                  message = `Git could not be found at the expected path: '${gitLocation}'. This might be a problem with how the application is packaged, so confirm this folder hasn't been removed when packaging.`
                  code = GitNotFoundErrorCode
                }

                const error = new Error(message) as ErrorWithCode
                error.name = err.name
                error.code = code
                reject(error)
              } else {
                reject(err)
              }

              return
            }

            if (typeof code === 'number') {
              resolve({ stdout, stderr, exitCode: code })
              return
            }

            // Git has returned an output that couldn't fit in the specified buffer
            // as we don't know how many bytes it requires, rethrow the error with
            // details about what it was previously set to...
            if (err.message === 'stdout maxBuffer exceeded') {
              reject(
                new Error(
                  `The output from the command could not fit into the allocated stdout buffer. Set options.maxBuffer to a larger value than ${maxBuffer} bytes`
                )
              )
            } else {
              reject(err)
            }
          }
        )

        pidResolve(spawnedProcess.pid)

        ignoreClosedInputStream(spawnedProcess)

        if (options && options.stdin !== undefined && spawnedProcess.stdin) {
          // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
          if (options.stdinEncoding) {
            spawnedProcess.stdin.end(options.stdin, options.stdinEncoding)
          } else {
            spawnedProcess.stdin.end(options.stdin)
          }
        }

        if (options && options.processCallback) {
          options.processCallback(spawnedProcess)
        }
      }),
      pidPromise
    )

    return result
  }

  /** Try to parse an error type from stderr. */
  public static parseError(stderr: string): GitError | null {
    for (const [regex, error] of Object.entries(GitErrorRegexes)) {
      if (stderr.match(regex)) {
        return error
      }
    }

    return null
  }

  public static parseBadConfigValueErrorInfo(
    stderr: string
  ): { key: string; value: string } | null {
    const errorEntry = Object.entries(GitErrorRegexes).find(
      ([_, v]) => v === GitError.BadConfigValue
    )

    if (errorEntry === undefined) {
      return null
    }

    const m = stderr.match(errorEntry[0])

    if (m === null) {
      return null
    }

    if (!m[1] || !m[2]) {
      return null
    }

    return { key: m[2], value: m[1] }
  }
}

/**
 * Prevent errors originating from the stdin stream related
 * to the child process closing the pipe from bubbling up and
 * causing an unhandled exception when no error handler is
 * attached to the input stream.
 *
 * The common scenario where this happens is if the consumer
 * is writing data to the stdin stream of a child process and
 * the child process for one reason or another decides to either
 * terminate or simply close its standard input. Imagine this
 * scenario
 *
 *  cat /dev/zero | head -c 1
 *
 * The 'head' command would close its standard input (by terminating)
 * the moment it has read one byte. In the case of Git this could
 * happen if you for example pass badly formed input to apply-patch.
 *
 * Since consumers of dugite using the `exec` api are unable to get
 * a hold of the stream until after we've written data to it they're
 * unable to fix it themselves so we'll just go ahead and ignore the
 * error for them. By supressing the stream error we can pick up on
 * the real error when the process exits when we parse the exit code
 * and the standard error.
 *
 * See https://github.com/desktop/desktop/pull/4027#issuecomment-366213276
 */
function ignoreClosedInputStream({ stdin }: ChildProcess) {
  // If Node fails to spawn due to a runtime error (EACCESS, EAGAIN, etc)
  // it will not setup the stdio streams, see
  // https://github.com/nodejs/node/blob/v10.16.0/lib/internal/child_process.js#L342-L354
  // The error itself will be emitted asynchronously but we're still in
  // the synchronous path so if we attempts to call `.on` on `.stdin`
  // (which is undefined) that error would be thrown before the underlying
  // error.
  if (!stdin) {
    return
  }

  stdin.on('error', err => {
    const code = (err as ErrorWithCode).code

    // Is the error one that we'd expect from the input stream being
    // closed, i.e. EPIPE on macOS and EOF on Windows. We've also
    // seen ECONNRESET failures on Linux hosts so let's throw that in
    // there for good measure.
    if (code === 'EPIPE' || code === 'EOF' || code === 'ECONNRESET') {
      return
    }

    // Nope, this is something else. Are there any other error listeners
    // attached than us? If not we'll have to mimic the behavior of
    // EventEmitter.
    //
    // See https://nodejs.org/api/errors.html#errors_error_propagation_and_interception
    //
    // "For all EventEmitter objects, if an 'error' event handler is not
    //  provided, the error will be thrown"
    if (stdin.listeners('error').length <= 1) {
      throw err
    }
  })
}

export enum GitTaskCancelResult {
  successfulCancel,
  processAlreadyEnded,
  noProcessIdDefined,
  failedToCancel,
}

/** This interface represents a git task (process). */
export interface IGitTask<T> {
  /** Result of the git process. */
  readonly result: Promise<T>
  /** Allows to cancel the process if it's running. Returns true if the process was killed. */
  readonly cancel: () => Promise<GitTaskCancelResult>
}

class GitTask<T> implements IGitTask<T> {
  constructor(result: Promise<T>, pid: Promise<number | undefined>) {
    this.result = result
    this.pid = pid
    this.processEnded = false
  }

  private pid: Promise<number | undefined>
  /** Process may end because process completed or process errored. Either way, we can no longer cancel it. */
  private processEnded: boolean

  result: Promise<T>

  public updateProcessEnded(): void {
    this.processEnded = true
  }

  public async cancel(): Promise<GitTaskCancelResult> {
    if (this.processEnded) {
      return GitTaskCancelResult.processAlreadyEnded
    }

    const pid = await this.pid

    if (pid === undefined) {
      return GitTaskCancelResult.noProcessIdDefined
    }

    try {
      kill(pid)
      return GitTaskCancelResult.successfulCancel
    } catch (e) {}

    return GitTaskCancelResult.failedToCancel
  }
}
