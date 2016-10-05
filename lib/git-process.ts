import * as path from 'path'
import * as fs from 'fs'

import { execFile, ChildProcess, ExecOptionsWithStringEncoding } from 'child_process'
import { GitError, GitErrorRegexes, NotFoundExitCode } from './errors'

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
   * An optional callback which will be invoked with the child
   * process instance immediately after spawning the git process.
   */
  readonly processCallback?: (process: ChildProcess) => void
}

export class GitProcess {
  /**
   *  Find the path to the embedded Git environment
   */
  private static resolveGitDir(): string {
    if (process.env.TEST) {
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
    if (process.platform === 'darwin') {
      return path.join(gitDir, 'bin', 'git')
    } else if (process.platform === 'win32') {
      return path.join(gitDir, 'cmd', 'git.exe')
    }

    throw new Error('Git not supported on platform: ' + process.platform)
  }

  /** Find the path to the embedded git exec path. */
  private static resolveGitExecPath(): string {
    const gitDir = GitProcess.resolveGitDir()
    if (process.platform === 'darwin') {
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

      let startTime: number | null = null
      if (typeof performance !== "undefined") {
        startTime = performance.now()
      }

      let envPath: string = process.env.PATH || ''

      if (process.platform === 'win32') {
        const gitDir = GitProcess.resolveGitDir()
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

      // Explicitly annotate opts since typescript is unable to infer the correct
      // signature for execFile when options is passed as an opaque hash. The type
      // definition for execFile currently infers based on the encoding parameter
      // which could change between declaration time and being passed to execFile.
      // See https://git.io/vixyQ
      const execOptions: ExecOptionsWithStringEncoding = {
        cwd: path,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        env
      }

      const spawnedProcess = execFile(gitLocation, args, execOptions, function(err, stdout, stderr) {
        const code = err ? (err as any).code : 0
        if (code === NotFoundExitCode) {
          if (GitProcess.pathExists(path) === false) {
            reject(new Error('Unable to find path to repository on disk.'))
            return
          }

          reject(new Error('Git could not be found. This is most likely a problem in git-kitchen-sink itself.'))
          return
        }

        if (console.debug && startTime) {
          const rawTime = performance.now() - startTime

          let timing = ''
          if (rawTime > 50) {
            const time = (rawTime / 1000).toFixed(3)
            timing = ` (took ${time}s)`
          }

          console.debug(`executing: git ${args.join(' ')}${timing}`)
        }

        resolve({ stdout, stderr, exitCode: code })
      })

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
