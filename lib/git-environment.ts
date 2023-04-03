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
      .resolve(__dirname, '..', '..', 'git', 'default')
      .replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`)
  }
  throw new Error('Git not supported on platform: ' + process.platform)
}

function resolveEmbeddedGitDirForWSL(): string {
  return path
    .resolve(__dirname, '..', '..', 'git_platforms', 'linux-x64')
    .replace(/[\\\/]app.asar[\\\/]/, `${path.sep}app.asar.unpacked${path.sep}`)
}

/**
 *  Find the path to the embedded Git environment.
 *
 *  If a custom Git directory path is defined as the `LOCAL_GIT_DIRECTORY` environment variable, then
 *  returns with it after resolving it as a path.
 */
function resolveGitDir(wslDistro?: string): string {
  if (wslDistro) {
    if (process.env.LOCAL_GIT_DIRECTORY_WSL != null) {
      return path.resolve(process.env.LOCAL_GIT_DIRECTORY_WSL)
    } else {
      return resolveEmbeddedGitDirForWSL()
    }
  }

  if (process.env.LOCAL_GIT_DIRECTORY != null) {
    return path.resolve(process.env.LOCAL_GIT_DIRECTORY)
  } else {
    return resolveEmbeddedGitDir()
  }
}

/**
 *  Find the path to the embedded Git binary.
 */
function resolveGitBinary(wslDistro?: string): {
  gitLocation: string
  gitArgs: string[]
} {
  const gitDir = resolveGitDir(wslDistro)

  if (wslDistro) {
    return {
      gitLocation: 'wsl.exe',
      gitArgs: [
        '-d',
        wslDistro,
        '-e',
        toWSLPath(path.join(gitDir, 'bin', 'git')),
      ],
    }
  }

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
function resolveGitExecPath(wslDistro?: string): string {
  if (wslDistro) {
    if (process.env.GIT_EXEC_PATH_WSL != null) {
      return path.resolve(process.env.GIT_EXEC_PATH_WSL)
    }
    return path.join(resolveGitDir(wslDistro), 'libexec', 'git-core')
  }

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
 * Convert a windows path to a WSL path.
 */
export function toWSLPath(windowsPath: string) {
  const [, drive, path] = windowsPath.match(/^([a-zA-Z]):(.*)/) ?? []

  if (!drive || !path) {
    return windowsPath
  }

  return `/mnt/${drive.toLowerCase()}${path.replace(/\\/g, '/')}`
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
  targetPath: string
): {
  env: NodeJS.ProcessEnv
  gitLocation: string
  gitArgs: string[]
} {
  const [, wslDistro] =
    targetPath.match(/\\\\wsl(?:\$|\.localhost)\\([^\\]+)\\/) ?? []

  const { gitLocation, gitArgs } = resolveGitBinary(wslDistro)

  let envPath: string = process.env.PATH || ''
  const gitDir = resolveGitDir(wslDistro)

  if (process.platform === 'win32' && !wslDistro) {
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
      GIT_EXEC_PATH: resolveGitExecPath(wslDistro),
      PATH: envPath,
    },
    environmentVariables
  )

  if (wslDistro) {
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
      'GIT_EXEC_PATH/p',
      'GIT_TEMPLATE_DIR/p',
      'PREFIX/p',
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

  if (
    process.platform === 'darwin' ||
    process.platform === 'linux' ||
    wslDistro
  ) {
    // templates are used to populate your .git folder
    // when a repository is initialized locally
    const templateDir = path.join(gitDir, 'share/git-core/templates')
    env.GIT_TEMPLATE_DIR = templateDir
  }

  if (process.platform === 'linux' || wslDistro) {
    // when building Git for Linux and then running it from
    // an arbitrary location, you should set PREFIX for the
    // process to ensure that it knows how to resolve things
    env.PREFIX = gitDir

    if (
      !env.GIT_SSL_CAINFO &&
      !(wslDistro ? env.LOCAL_GIT_DIRECTORY_WSL : env.LOCAL_GIT_DIRECTORY)
    ) {
      // use the SSL certificate bundle included in the distribution only
      // when using embedded Git and not providing your own bundle
      const distDir = resolveGitDir(wslDistro)
      const sslCABundle = path.join(distDir, 'ssl/cacert.pem')
      env.GIT_SSL_CAINFO = sslCABundle
    }
  }

  return { env, gitLocation, gitArgs }
}
