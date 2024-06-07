import * as path from 'path'
import { EnvMap } from './env-map'

export function resolveEmbeddedGitDir(): string {
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
export function resolveGitDir(localGitDir = process.env.LOCAL_GIT_DIR): string {
  return localGitDir ? path.resolve(localGitDir) : resolveEmbeddedGitDir()
}

/**
 *  Find the path to the embedded Git binary.
 */
export function resolveGitBinary(
  localGitDir = process.env.LOCAL_GIT_DIRECTORY
): string {
  const gitDir = resolveGitDir(localGitDir)
  if (process.platform === 'win32') {
    return path.join(gitDir, 'cmd', 'git.exe')
  } else {
    return path.join(gitDir, 'bin', 'git')
  }
}

/**
 * Find the path to the embedded git exec path.
 *
 * If a custom git exec path is given as the `GIT_EXEC_PATH` environment variable,
 * then it returns with it after resolving it as a path.
 */
export function resolveGitExecPath(
  localGitDir = process.env.LOCAL_GIT_DIRECTORY,
  gitExecPath = process.env.GIT_EXEC_PATH
): string {
  if (gitExecPath) {
    return path.resolve(gitExecPath)
  }
  const gitDir = resolveGitDir(localGitDir)
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
  environmentVariables: Record<string, string | undefined>,
  processEnv = process.env
): {
  env: Record<string, string | undefined>
  gitLocation: string
} {
  const env = new EnvMap([
    ...Object.entries(processEnv),
    ...Object.entries(environmentVariables),
  ])

  const localGitDir = env.get('LOCAL_GIT_DIRECTORY')
  const gitLocation = resolveGitBinary(localGitDir)
  const gitDir = resolveGitDir(localGitDir)

  if (process.platform === 'win32') {
    const mingw = process.arch === 'x64' ? 'mingw64' : 'mingw32'
    env.set(
      'PATH',
      `${gitDir}\\${mingw}\\bin;${gitDir}\\${mingw}\\usr\\bin;${
        env.get('PATH') ?? ''
      }`
    )
  }

  env.set(
    'GIT_EXEC_PATH',
    resolveGitExecPath(localGitDir, env.get('GIT_EXEC_PATH'))
  )

  // On Windows the contained Git environment (minGit) ships with a system level
  // gitconfig that we can control but on macOS and Linux /etc/gitconfig is used\
  // as the system-wide configuration file and we're unable to modify it.
  //
  // So in order to be able to provide our own sane defaults that can be overriden
  // by the user's global and local configuration we'll tell Git to use
  // dugite-native's custom gitconfig on those platforms.
  if (process.platform !== 'win32' && !env.get('GIT_CONFIG_SYSTEM')) {
    env.set('GIT_CONFIG_SYSTEM', path.join(gitDir, 'etc', 'gitconfig'))
  }

  if (process.platform === 'darwin' || process.platform === 'linux') {
    // templates are used to populate your .git folder
    // when a repository is initialized locally
    const templateDir = `${gitDir}/share/git-core/templates`
    env.set('GIT_TEMPLATE_DIR', templateDir)
  }

  if (process.platform === 'linux') {
    // when building Git for Linux and then running it from
    // an arbitrary location, you should set PREFIX for the
    // process to ensure that it knows how to resolve things
    env.set('PREFIX', gitDir)

    if (!env.get('GIT_SSL_CAINFO') && !env.get('LOCAL_GIT_DIRECTORY')) {
      // use the SSL certificate bundle included in the distribution only
      // when using embedded Git and not providing your own bundle
      const distDir = resolveEmbeddedGitDir()
      const sslCABundle = `${distDir}/ssl/cacert.pem`
      env.set('GIT_SSL_CAINFO', sslCABundle)
    }
  }

  return { env: Object.fromEntries(env.entries()), gitLocation }
}
