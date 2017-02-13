import * as path from 'path'
import * as fs from 'fs'

import { execFile, ExecOptionsWithStringEncoding } from 'child_process'
import { GitError, GitErrorRegexes, NotFoundExitCode } from './errors'
import { ChildProcess } from 'child_process'

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
  /**
   *  Find the path to the embedded Git environment
   */
  private static resolveGitDir(): string {
    if (process.env.TEST_WITH_LOCAL_GIT) {
      return path.join(__dirname, '..', 'git')
    } else {
      return path.join(__dirname, '..', '..', 'git')
    }
  }

  /**
   *  Find the path to the embedded Git binary
   */
  private static resolveGitBinary(): string {
    const gitDir = GitProcess.resolveGitDir()
    if (process.platform === 'darwin' || process.platform === 'linux') {
      return path.join(gitDir, 'bin', 'git')
    } else if (process.platform === 'win32') {
      return path.join(gitDir, 'cmd', 'git.exe')
    }

    throw new Error('Git not supported on platform: ' + process.platform)
  }

  /** Find the path to the embedded git exec path. */
  private static resolveGitExecPath(): string {
    const gitDir = GitProcess.resolveGitDir()
    if (process.platform === 'darwin' || process.platform === 'linux') {
      return path.join(gitDir, 'libexec', 'git-core')
    } else if (process.platform === 'win32') {
      return path.join(gitDir, 'mingw64', 'libexec', 'git-core')
    }

    throw new Error('Git not supported on platform: ' + process.platform)
  }

  private static pathExists(path: string): Boolean {
    try {
        fs.accessSync(path, (fs as any).F_OK);
        return true
    } catch (e) {
        return false
    }
  }

  /**
   * Execute a command and read the output using the embedded Git environment.
   *
   * The returned promise will only reject when the git executable failed to launch.
   * See the result's `stderr` and `exitCode` for any potential error information.
   */
  public static exec(args: string[], path: string, options?: IGitExecutionOptions): Promise<IGitResult> {
    return new Promise<IGitResult>(function(resolve, reject) {
      const gitLocation = GitProcess.resolveGitBinary()

      let envPath: string = process.env.PATH || ''
      const gitDir = GitProcess.resolveGitDir()

      if (process.platform === 'win32') {
        envPath = `${gitDir}\\mingw64\\bin;${envPath}`
      }

      const env = Object.assign({}, process.env, {
        GIT_EXEC_PATH: GitProcess.resolveGitExecPath(),
        PATH: envPath,
      }, options ? options.env : { })

      if (process.platform === 'win32') {
        // while reading the environment variable is case-insensitive
        // you can create a hash with multiple values, which means the
        // wrong value might be used when spawning the child process
        //
        // this ensures we only ever supply one value for PATH
        if (env.Path) {
          delete env.Path
        }
      }

      if (process.platform === 'darwin' || process.platform === 'linux') {
        // templates are used to populate your .git folder
        // when a repository is initialized locally
        const templateDir = `${gitDir}/share/git-core/templates`
        env.GIT_TEMPLATE_DIR = templateDir
      }

      if (process.platform === 'linux') {
        // when building Git for Linux and then running it from
        // an arbitrary location, you should set PREFIX for the
        // process to ensure that it knows how to resolve things
        env.PREFIX = gitDir

        // bypass whatever certificates might be set and use
        // the bundle included in the distibution
        const sslCABundle = `${gitDir}/ssl/cacert.pem`
        env.GIT_SSL_CAINFO = sslCABundle
      }

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
          if (code === NotFoundExitCode) {
            let message = err.message
            if (GitProcess.pathExists(path) === false) {
              message = 'Unable to find path to repository on disk.'
            } else {
              message = 'Git could not be found. This is most likely a problem in git-kitchen-sink itself.'
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
