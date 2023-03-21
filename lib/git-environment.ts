import * as path from 'path'

function resolveEmbeddedGitDir(): string {
  if (
    process.platform === 'darwin' ||
    process.platform === 'linux' ||
    process.platform === 'android' ||
    process.platform === 'win32'
  ) {
    const s = path.sep
    return path
      .resolve(__dirname, '..', '..', 'git')
      .replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`)
  }
  throw new Error('Git not supported on platform: ' + process.platform)
}

/**
 *  Find the path to the embedded Git environment.
 *
 *  If a custom Git directory path is defined as the `LOCAL_GIT_DIRECTORY` environment variable, then
 *  returns with it after resolving it as a path.
 */
function resolveGitDir(): string {
  if (process.env.LOCAL_GIT_DIRECTORY != null) {
    return path.resolve(process.env.LOCAL_GIT_DIRECTORY)
  } else {
    return resolveEmbeddedGitDir()
  }
}

/**
 *  Find the path to the embedded Git binary.
 */
function resolveGitBinary(path_: string): {
  gitLocation: string
  gitArgs: string[]
} {
  const [, wslDistro] =
    path_.match(/\\\\wsl(?:\$|\.localhost)\\([^\\]+)\\/) ?? []

  if (wslDistro) {
    return {
      gitLocation: 'wsl.exe',
      gitArgs: ['-d', wslDistro, '-e', 'git'],
    }
  }

  const gitDir = resolveGitDir()
  if (process.platform === 'win32') {
    return { gitLocation: path.join(gitDir, 'cmd', 'git.exe'), gitArgs: [] }
  } else {
    return { gitLocation: path.join(gitDir, 'bin', 'git'), gitArgs: [] }
  }
}

/**
 * Find the path to the embedded git exec path.
 *
 * If a custom git exec path is given as the `GIT_EXEC_PATH` environment variable,
 * then it returns with it after resolving it as a path.
 */
function resolveGitExecPath(): string {
  if (process.env.GIT_EXEC_PATH != null) {
    return path.resolve(process.env.GIT_EXEC_PATH)
  }
  const gitDir = resolveGitDir()
  if (process.platform === 'win32') {
    if (process.arch === 'x64') {
      return path.join(gitDir, 'mingw64', 'libexec', 'git-core')
    }

    return path.join(gitDir, 'mingw32', 'libexec', 'git-core')
  } else {
    return path.join(gitDir, 'libexec', 'git-core')
  }
}

/**
 * Setup the process environment before invoking Git.
 *
 * This method resolves the Git executable and creates the array of key-value
 * pairs which should be used as environment variables.
 *
 * @param additional options to include with the process
 */
export function setupEnvironment(
  environmentVariables: NodeJS.ProcessEnv,
  path: string
): {
  env: NodeJS.ProcessEnv
  gitLocation: string
  gitArgs: string[]
} {
  const { gitLocation, gitArgs } = resolveGitBinary(path)

  let envPath: string = process.env.PATH || ''
  const gitDir = resolveGitDir()

  if (process.platform === 'win32') {
    if (process.arch === 'x64') {
      envPath = `${gitDir}\\mingw64\\bin;${gitDir}\\mingw64\\usr\\bin;${envPath}`
    } else {
      envPath = `${gitDir}\\mingw32\\bin;${gitDir}\\mingw32\\usr\\bin;${envPath}`
    }
  }

  const env = Object.assign(
    {},
    process.env,
    {
      GIT_EXEC_PATH: resolveGitExecPath(),
      PATH: envPath,
    },
    environmentVariables
  )

  if (gitLocation === 'wsl.exe') {
    // Forward certain environment variables to WSL to allow authentication.
    // The /p flag translates windows<->wsl paths.
    env.WSLENV = [
      env?.WSLENV,
      'GIT_ASKPASS/p',
      'DESKTOP_USERNAME',
      'DESKTOP_ENDPOINT',
      'DESKTOP_PORT',
      'DESKTOP_TRAMPOLINE_TOKEN',
      'DESKTOP_TRAMPOLINE_IDENTIFIER',
    ]
      .filter(Boolean)
      .join(':')
  }

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

    if (!env.GIT_SSL_CAINFO && !env.LOCAL_GIT_DIRECTORY) {
      // use the SSL certificate bundle included in the distribution only
      // when using embedded Git and not providing your own bundle
      const distDir = resolveEmbeddedGitDir()
      const sslCABundle = `${distDir}/ssl/cacert.pem`
      env.GIT_SSL_CAINFO = sslCABundle
    }
  }

  return { env, gitLocation, gitArgs }
}
