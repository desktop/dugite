import { ChildProcess, execFile, ExecFileOptions } from 'child_process'
import { setupEnvironment } from './git-environment'
import { ExecError } from './errors'
import { ignoreClosedInputStream } from './ignore-closed-input-stream'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

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
   * Largest amount of data in bytes allowed on stdout or stderr. If exceeded,
   * the child process is terminated and any output is truncated.
   *
   * See https://nodejs.org/docs/latest-v22.x/api/child_process.html#maxbuffer-and-unicode
   *
   * If not specified the default is Infinity, i.e. the only limit is the amount
   * of allocatable memory on the system.
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

  readonly ignoreExitCodes?: ReadonlyArray<number> | true
}

export interface IGitStringExecutionOptions extends IGitExecutionOptions {
  readonly encoding?: BufferEncoding
}

export interface IGitBufferExecutionOptions extends IGitExecutionOptions {
  readonly encoding: 'buffer'
}

const coerceStdio = (
  stdio: string | Buffer,
  encoding: BufferEncoding | 'buffer'
) => {
  if (encoding === 'buffer') {
    return Buffer.isBuffer(stdio) ? stdio : Buffer.from(stdio)
  }

  return Buffer.isBuffer(stdio) ? stdio.toString(encoding) : stdio
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
export function exec(
  args: string[],
  path: string,
  options?: IGitStringExecutionOptions
): Promise<IGitStringResult>
export function exec(
  args: string[],
  path: string,
  options?: IGitBufferExecutionOptions
): Promise<IGitBufferResult>
export function exec(
  args: string[],
  path: string,
  options?: IGitExecutionOptions
): Promise<IGitResult> {
  const { env, gitLocation } = setupEnvironment(options?.env ?? {})

  const opts = {
    cwd: path,
    env,
    encoding: options?.encoding ?? 'utf8',
    maxBuffer: options?.maxBuffer ?? Infinity,
    signal: options?.signal,
    killSignal: options?.killSignal,
  }

  const promise = execFileAsync(gitLocation, args, opts)

  ignoreClosedInputStream(promise.child)

  promise.child.on('spawn', () => {
    if (options?.stdin !== undefined && promise.child.stdin) {
      // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
      if (options.stdinEncoding) {
        promise.child.stdin.end(options.stdin, options.stdinEncoding)
      } else {
        promise.child.stdin.end(options.stdin)
      }
    }
  })

  options?.processCallback?.(promise.child)

  return promise
    .then(({ stdout, stderr }) => ({ stdout, stderr, exitCode: 0 }))
    .catch(e => {
      if (typeof e !== 'object') {
        const stdio = coerceStdio('', opts.encoding)
        throw new ExecError(typeof e === 'string' ? e : `${e}`, stdio, stdio, e)
      }

      const stdout = coerceStdio('stdout' in e ? e.stdout : '', opts.encoding)
      const stderr = coerceStdio('stderr' in e ? e.stderr : '', opts.encoding)

      if ('code' in e && typeof e.code === 'number') {
        const ignoreExitCodes = options?.ignoreExitCodes
        if (ignoreExitCodes === true || ignoreExitCodes?.includes(e.code)) {
          return { stdout, stderr, exitCode: e.code }
        }
        throw new ExecError(`Git failed with code ${e.code}`, stdout, stderr, e)
      }

      throw new ExecError(e.message, stdout, stderr, e)
    })
}
