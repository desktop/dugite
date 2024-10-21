import { execFile, ExecFileOptions, spawn } from 'child_process'
import { GitError, GitErrorRegexes, ExecError } from './errors'
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

  /**
   * An abort signal which, when triggered, will cause a signal to be sent
   * to the child process (determined by the killSignal option).
   */
  readonly signal?: AbortSignal

  /**
   * The signal to send to the child process when calling ChildProcess.kill
   * without an explicit signal or when the process is killed due to the
   * AbortSignal being triggered. Defaults to 'SIGTERM'
   */
  readonly killSignal?: ExecFileOptions['killSignal']
}

export interface IGitStringExecutionOptions extends IGitExecutionOptions {
  readonly encoding?: BufferEncoding
}

export interface IGitBufferExecutionOptions extends IGitExecutionOptions {
  readonly encoding: 'buffer'
}

export class GitProcess {
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
    const { env, gitLocation } = setupEnvironment(options?.env ?? {})
    const spawnedProcess = spawn(gitLocation, args, { env, cwd: path })

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
  public static async exec(
    args: string[],
    path: string,
    options?: IGitStringExecutionOptions
  ): Promise<IGitStringResult>
  public static async exec(
    args: string[],
    path: string,
    options?: IGitBufferExecutionOptions
  ): Promise<IGitBufferResult>
  public static async exec(
    args: string[],
    path: string,
    options?: IGitExecutionOptions
  ): Promise<IGitResult> {
    const { env, gitLocation } = setupEnvironment(options?.env ?? {})

    const opts = {
      cwd: path,
      env,
      encoding: options?.encoding,
      maxBuffer: options ? options.maxBuffer : 10 * 1024 * 1024,
      signal: options?.signal,
      killSignal: options?.killSignal,
    }

    return new Promise<IGitResult>((resolve, reject) => {
      const cp = execFile(gitLocation, args, opts, (err, stdout, stderr) => {
        if (!err || typeof err.code === 'number') {
          const exitCode = typeof err?.code === 'number' ? err.code : 0
          resolve({ stdout, stderr, exitCode })
          return
        }

        // If the error's code is a string then it means the code isn't the
        // process's exit code but rather an error coming from Node's bowels,
        // e.g., ENOENT.
        let { message } = err

        if (err.code === 'ENOENT') {
          message =
            `ENOENT: Git failed to execute. This typically means that ` +
            `the path provided doesn't exist or that the Git executable ` +
            `could not be found which could indicate a problem with the ` +
            `packaging of dugite. Verify that resolveGitBinary returns a ` +
            `valid path to the git binary.`
        }

        reject(new ExecError(message, stdout, stderr, err))
      })

      ignoreClosedInputStream(cp)

      if (options?.stdin !== undefined && cp.stdin) {
        // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
        if (options.stdinEncoding) {
          cp.stdin.end(options.stdin, options.stdinEncoding)
        } else {
          cp.stdin.end(options.stdin)
        }
      }

      options?.processCallback?.(cp)
    })
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
    const code =
      'code' in err && typeof err.code === 'string' ? err.code : undefined

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
