import * as path from 'path'
import { execFile, ChildProcess, ExecOptionsWithStringEncoding } from 'child_process'

export enum GitErrorCode {
  NotFound = 128
}

/** The result of shelling out to git. */
export interface IResult {
  /** The stdout from git. */
  readonly stdout: string

  /** The stderr from git. */
  readonly stderr: string

  /** The exit code of the git process. */
  readonly exitCode: number
}

/**
 * Encapsulate the error from Git for callers to handle
 */
export class GitError extends Error {
  /**
   * The error code returned from the Git process
   */
  public readonly errorCode: GitErrorCode

  /**
   * The error text returned from the Git process
   */
  public readonly errorOutput: string

  public constructor(errorCode: number, errorOutput: string) {
    super()

    this.errorCode = errorCode
    this.errorOutput = errorOutput
  }
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

  /**
   * Execute a command using the embedded Git environment
   *
   * The returned promise will only reject when git cannot be found. See the
   * result's `stderr` and `exitCode` for any potential error information.
   */
  public static exec(args: string[], path: string, customEnv?: Object, processCb?: (process: ChildProcess) => void): Promise<void> {
    return GitProcess.execWithOutput(args, path, customEnv, processCb)
  }

  /**
   * Execute a command and read the output using the embedded Git environment.
   *
   * The returned promise will only reject when git cannot be found. See the
   * result's `stderr` and `exitCode` for any potential error information.
   */
  public static execWithOutput(args: string[], path: string, customEnv?: Object, processCb?: (process: ChildProcess) => void): Promise<IResult> {
    return new Promise<IResult>(function(resolve, reject) {
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
      }, customEnv)

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
      const opts: ExecOptionsWithStringEncoding = {
        cwd: path,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        env
      }

      const spawnedProcess = execFile(gitLocation, args, opts, function(err, stdout, stderr) {
        const code = (err as any).code || 0
        if (code === GitErrorCode.NotFound) {
          reject(new GitError(GitErrorCode.NotFound, stderr))
        } else {
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
        }
      })

      if (processCb) {
        processCb(spawnedProcess)
      }
    })
  }
}
