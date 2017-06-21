
import * as fs from 'fs'

import { execFile, spawn, ExecFileOptionsWithStringEncoding } from 'child_process'
import { GitError, GitErrorRegexes, RepositoryDoesNotExistErrorCode, GitNotFoundErrorCode } from './errors'
import { ChildProcess } from 'child_process'

import { setupEnvironment } from './git-environment'

/** The result of shelling out to git. */
export interface IGitResult {
  /** The standard output from git. */
  readonly stdout: string

  /** The standard error output from git. */
  readonly stderr: string

  /** The exit code of the git process. */
  readonly exitCode: number
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
  readonly env?: Object,
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
  readonly env?: Object,

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
  readonly stdinEncoding?: string

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

/**
 * The errors coming from `execFile` have a `code` and we wanna get at that
 * without resorting to `any` casts.
 */
interface ErrorWithCode extends Error {
  code: string | number
}

interface IRunningGitProcess {
  child_process: ChildProcess,
  promise: Promise<IGitResult>
}

function formatPktLine(content: string) {
  if (content.length > 65520) {
    throw new Error('protocol error: impossibly long line')
  }

  const hexLength = (content.length + 4).toString(16)
  const pktLineLen = (`0000${hexLength}`).substring(hexLength.length)

  return pktLineLen + content
}

async function startProcess(file: string, args: string[], options: ExecFileOptionsWithStringEncoding): Promise<IRunningGitProcess> {

  let child_process: ChildProcess | undefined

  const promise = new Promise<IGitResult>((resolve, reject) => {
    child_process = execFile(file, args, options, function(err: ErrorWithCode, stdout, stderr) {
      const code = err ? err.code : 0
      // If the error's code is a string then it means the code isn't the
      // process's exit code but rather an error coming from Node's bowels,
      // e.g., ENOENT.
      if (typeof code === 'string') {
        if (code === 'ENOENT') {
          let message = err.message
          let code = err.code
          if (options && options.cwd && pathExists(options.cwd) === false) {
            message = 'Unable to find path to repository on disk.'
            code = RepositoryDoesNotExistErrorCode
          } else {
            message = `Git could not be found at the expected path: '${file}'. This might be a problem with how the application is packaged, so confirm this folder hasn't been removed when packaging.`
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

      if (code === undefined && err) {
        // Git has returned an output that couldn't fit in the specified buffer
        // as we don't know how many bytes it requires, rethrow the error with
        // details about what it was previously set to...
        if (err.message === 'stdout maxBuffer exceeded') {
          reject(new Error(`The output from the command could not fit into the allocated stdout buffer. Set options.maxBuffer to a larger value than ${options.maxBuffer} bytes`))
        }
      }

      /**
       * If we're running read-command we won't get the ENOENT error from git since we're
       * always launching the process in a known location and then, at a later stage,
       * letting Git know where to operate. We will, however, get a very specific error
       * message and a known exit code so we'll intercept that and throw the same
       * error as we do for ENOENT.
       */
      if (code === 128 && /fatal: Cannot change to '(.*?)': No such file or directory/.test(stderr)) {
        const error = new Error('Unable to find path to repository on disk.') as ErrorWithCode
        error.code = RepositoryDoesNotExistErrorCode
        return reject(error)
      }

      resolve({ stdout, stderr, exitCode: code })
    })
  })


  if (!child_process) {
    throw Error('failed to start process')
  }

  return { child_process, promise }
}

function pathExists(path: string): Boolean {
  try {
      fs.accessSync(path, (fs as any).F_OK);
      return true
  } catch (e) {
      return false
  }
}

let HotSpare: IRunningGitProcess | null = null
let LaunchingHotSpare = false

export class GitProcess {

  /**
   * Execute a command and interact with the process outputs directly.
   *
   * The returned promise will reject when the git executable fails to launch,
   * in which case the thrown Error will have a string `code` property. See
   * `errors.ts` for some of the known error codes.
   */
  public static spawn(args: string[], path: string, options?: IGitSpawnExecutionOptions): ChildProcess {
    let customEnv = { }
    if (options && options.env) {
      customEnv = options.env
    }

    const { env, gitLocation } = setupEnvironment(customEnv)

    const spawnArgs = {
      env,
      cwd: path
    }

    const spawnedProcess = spawn(gitLocation, args, spawnArgs)

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
  public static async exec(args: string[], path: string, options?: IGitExecutionOptions): Promise<IGitResult> {
    let customEnv = { }

    if (options && options.env) {
      customEnv = options.env
    }

    const { env, gitLocation } = setupEnvironment(customEnv)
    const useReadCommand = 'GIT_USE_READ_COMMAND' in process.env

    const execOptions: ExecFileOptionsWithStringEncoding = {
      cwd: useReadCommand ? process.cwd() : path,
      encoding: 'utf8',
      maxBuffer: options ? options.maxBuffer : 10 * 1024 * 1024,
      env: useReadCommand ? { } : env,
    }

    let readCommandArgs

    if (useReadCommand) {
      readCommandArgs = [ '-C', path, ...args ]
      args = [ 'read-command' ]
    }

    let child_process
    let promise

    if (useReadCommand && HotSpare !== null) {
      child_process = HotSpare.child_process
      promise = HotSpare.promise
      HotSpare = null
    } else {
      const p = await startProcess(gitLocation, args, execOptions)
      child_process = p.child_process
      promise = p.promise
    }

    if (useReadCommand) {
      setImmediate(async function() {
        if (HotSpare === null && !LaunchingHotSpare) {
          LaunchingHotSpare = true
          try {
            HotSpare = await startProcess(gitLocation, args, execOptions)
          } finally {
            LaunchingHotSpare = false
          }
        }
      })
    }

    if (readCommandArgs !== undefined) {
      const readCommandEnv = env as any
      const environmentKeys = Object.keys(readCommandEnv)

      child_process.stdin.write(formatPktLine(environmentKeys.length.toString(10)))

      for (const key of environmentKeys) {
        child_process.stdin.write(formatPktLine(`${key}=${readCommandEnv[key]}`))
      }

      child_process.stdin.write(formatPktLine(readCommandArgs.length.toString(10)))

      for (const arg of readCommandArgs) {
        child_process.stdin.write(formatPktLine(arg))
      }
    }

    if (options && options.stdin) {
      // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
      child_process.stdin.end(options.stdin, options.stdinEncoding)
    }

    if (options && options.processCallback) {
      options.processCallback(child_process)
    }

    return promise
  }

  /** Try to parse an error type from stderr. */
  public static parseError(stderr: string): GitError | null {
    for (const regex in GitErrorRegexes) {
      if (stderr.match(regex)) {
        const error: GitError = (GitErrorRegexes as any)[regex]
        return error
      }
    }

    return null
  }

  public static shutdown() {
    if (HotSpare) {
      HotSpare.child_process.kill()
    }
  }
}

// Make sure we shut down any running read-command processes when the
// process is getting ready to exit.
process.on('exit', GitProcess.shutdown)
