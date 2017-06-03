import * as path from 'path'

/**
 *  Find the path to the embedded Git environment
 */
function resolveGitDir(): string {
  if (process.env.LOCAL_GIT_DIRECTORY) {
    return path.resolve(process.env.LOCAL_GIT_DIRECTORY)
  } else {
    return path.resolve(__dirname, '..', '..', 'git')
      .replace(/[\\\/]app.asar[\\\/]/, 'app.asar.unpacked');
  }
}

/**
 *  Find the path to the embedded Git binary
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
 */
function resolveGitExecPath(): string {
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

    // bypass whatever certificates might be set and use
    // the bundle included in the distibution
    const sslCABundle = `${gitDir}/ssl/cacert.pem`
    env.GIT_SSL_CAINFO = sslCABundle
  }

  return { env, gitLocation }
}
