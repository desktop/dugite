import * as path from 'path'

function resolveEmbeddedGitDir(): string {
  const s = path.sep;
  return path.resolve(__dirname, '..', '..', 'git')
    .replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`);
}

/**
 *  Find the path to the embedded Git environment.
 *
 *  If a custom Git directory path is defined as the `LOCAL_GIT_DIRECTORY` environment variable, then
 *  returns with it after resolving it as a path.
 */
function resolveGitDir(): string {
  if (process.env.LOCAL_GIT_DIRECTORY) {
    return path.resolve(process.env.LOCAL_GIT_DIRECTORY)
  }
  return resolveEmbeddedGitDir()
}

/**
 * Returns with the directory path of the embedded Git executable.
 */
function resolveEmbeddedGitDir(): string {
  const s = path.sep
  const dirPath = path.resolve(__dirname, '..', '..', 'git')
  return dirPath.replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`)
}

/**
 *  Find the path to the embedded Git binary.
 */
function resolveGitBinary(): string {
  const gitDir = resolveGitDir()
  if (process.platform === 'darwin' || process.platform === 'linux') {
    return path.join(gitDir, 'bin', 'git')
  } else if (process.platform === 'win32') {
    return path.join(gitDir, 'cmd', 'git.exe')
  }

  throw new Error('Git not supported on platform: ' + process.platform)
}

/**
 * Find the path to the embedded git exec path.
 *
 * If a custom git exec path is given as the `GIT_EXEC_PATH` environment variable,
 * then it returns with it after resolving it as a path.
 */
function resolveGitExecPath(): string {
  if (process.env.GIT_EXEC_PATH) {
    return path.resolve(process.env.GIT_EXEC_PATH)
  }
  const gitDir = resolveGitDir()
  if (process.platform === 'darwin' || process.platform === 'linux') {
    return path.join(gitDir, 'libexec', 'git-core')
  } else if (process.platform === 'win32') {
    return path.join(gitDir, 'mingw64', 'libexec', 'git-core')
  }

  throw new Error('Git not supported on platform: ' + process.platform)
}

/**
 * Setup the process environment before invoking Git.
 *
 * This method resolves the Git executable and creates the array of key-value
 * pairs which should be used as environment variables.
 *
 * @param additional options to include with the process
 */
export function setupEnvironment(environmentVariables: Object): { env: Object, gitLocation: string } {
  const gitLocation = resolveGitBinary()

  let envPath: string = process.env.PATH || ''
  const gitDir = resolveGitDir()

  if (process.platform === 'win32') {
    envPath = `${gitDir}\\mingw64\\bin;${envPath}`
  }

  const env = Object.assign({}, process.env, {
    GIT_EXEC_PATH: resolveGitExecPath(),
    PATH: envPath,
  }, environmentVariables)

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

  return { env, gitLocation }
}
