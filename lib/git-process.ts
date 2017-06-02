
import * as fs from 'fs'

import { execFile, spawn, ExecOptionsWithStringEncoding } from 'child_process'
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
   * An optional callback which will be invoked with the child
   * process instance after spawning the git process.
   *
   * Note that if the stdin parameter was specified the stdin
   * stream will be closed by the time this callback fires.
   */
   readonly processCallback?: (process: ChildProcess) => void
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

export class GitProcess {

  private static pathExists(path: string): Boolean {
    try {
        fs.accessSync(path, (fs as any).F_OK);
        return true
    } catch (e) {
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

    if (options && options.stdin) {
      // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
      spawnedProcess.stdin.end(options.stdin, options.stdinEncoding)
    }

    if (options && options.processCallback) {
      options.processCallback(spawnedProcess)
    }

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
  public static exec(args: string[], path: string, options?: IGitExecutionOptions): Promise<IGitResult> {
    return new Promise<IGitResult>(function(resolve, reject) {
      let customEnv = { }
      if (options && options.env) {
        customEnv = options.env
      }

      const { env, gitLocation } = setupEnvironment(customEnv)

      // Explicitly annotate opts since typescript is unable to infer the correct
      // signature for execFile when options is passed as an opaque hash. The type
      // definition for execFile currently infers based on the encoding parameter
      // which could change between declaration time and being passed to execFile.
      // See https://git.io/vixyQ
      const execOptions: ExecOptionsWithStringEncoding = {
        cwd: path,
        encoding: 'utf8',
        maxBuffer: options ? options.maxBuffer : 10 * 1024 * 1024,
        env
      }

      const spawnedProcess = execFile(gitLocation, args, execOptions, function(err: ErrorWithCode, stdout, stderr) {
        const code = err ? err.code : 0
        // If the error's code is a string then it means the code isn't the
        // process's exit code but rather an error coming from Node's bowels,
        // e.g., ENOENT.
        if (typeof code === 'string') {
          if (code === 'ENOENT') {
            let message = err.message
            let code = err.code
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

        if (code === undefined && err) {
          // Git has returned an output that couldn't fit in the specified buffer
          // as we don't know how many bytes it requires, rethrow the error with
          // details about what it was previously set to...
          if (err.message === 'stdout maxBuffer exceeded') {
            reject(new Error(`The output from the command could not fit into the allocated stdout buffer. Set options.maxBuffer to a larger value than ${execOptions.maxBuffer} bytes`))
          }
        }

        resolve({ stdout, stderr, exitCode: code })
      })

      if (options && options.stdin) {
        // See https://github.com/nodejs/node/blob/7b5ffa46fe4d2868c1662694da06eb55ec744bde/test/parallel/test-stdin-pipe-large.js
        spawnedProcess.stdin.end(options.stdin, options.stdinEncoding)
      }

      if (options && options.processCallback) {
        options.processCallback(spawnedProcess)
      }
    })
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
}
