import * as path from 'path'
import * as cp from 'child_process'

const gitNotFoundErrorCode: number = 128
const gitChangesExistErrorCode: number = 1

export enum GitErrorCode {
  NotFound
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
   *  Execute a command using the embedded Git environment
   */
  public static exec(args: string[], path: string, customEnv?: Object, processCb?: (process: cp.ChildProcess) => void): Promise<void> {
    return GitProcess.execWithOutput(args, path, customEnv, processCb)
  }

  /**
   *  Execute a command and read the output using the embedded Git environment
   */
  public static execWithOutput(args: string[], path: string, customEnv?: Object, processCb?: (process: cp.ChildProcess) => void): Promise<string> {
    return new Promise<string>(function(resolve, reject) {
      const gitLocation = GitProcess.resolveGitBinary()

      let logMessage: () => string
      if (typeof performance === "undefined") {
        logMessage = () => ''
      } else {
        const startTime = performance.now()
        logMessage = () => {
          const rawTime = performance.now() - startTime

          let timing = ''
          if (rawTime > 50) {
            const time = (rawTime / 1000).toFixed(3)
            timing = ` (took ${time}s)`
          }

          return `executing: git ${args.join(' ')}${timing}`
        }
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

      const opts = {
        cwd: path,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        env
      }
      const spawnedProcess = cp.execFile(gitLocation, args, opts, function(err, output, stdErr) {
        if (!err) {
          if (console.debug) {
            console.debug(logMessage())
          }

          resolve(output)
          return
        }

        if ((err as any).code) {
          console.error(stdErr)
          console.error(err)

          // TODO: handle more error codes
          const code: number = (err as any).code
          if (code === gitNotFoundErrorCode) {
            reject(new GitError(GitErrorCode.NotFound, stdErr))
            return
          }

          if (code === gitChangesExistErrorCode && output !== '') {
            // `git diff` seems to emulate the exit codes from `diff`
            // irrespective of whether you set --exit-code
            //
            // this is the behaviour:
            // - 0 if no changes found
            // - 1 if changes found
            // -   and error otherwise
            //
            // citation in source:
            // https://github.com/git/git/blob/1f66975deb8402131fbf7c14330d0c7cdebaeaa2/diff-no-index.c#L300
            console.debug(logMessage())
            resolve(output)
            return
          }
        }

        console.error(logMessage())
        console.error(err)
        reject(err)
      })

      if (processCb) {
        processCb(spawnedProcess)
      }
    })
  }
}
