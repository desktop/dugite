import * as Path from 'path'

function getAskPassScriptPath(): string {
  const projectRoot = Path.dirname(__dirname)
  return Path.join(projectRoot, 'build', 'test', 'auth', `main.js`)
}

function getAskPassTrampolinePath(): string {
  const isWindows = process.platform === 'win32'
  const extension = isWindows ? 'bat' : 'sh'
  return Path.resolve(__dirname, 'auth', `ask-pass.${extension}`)
}

export function setupAskPass(username?: string, password?: string): Object {
  return {
    // supported since Git 2.3, this is used to ensure we never interactively prompt
    // for credentials - even as a fallback
    GIT_TERMINAL_PROMPT: '0',
    TEST_USERNAME: username,
    TEST_PASSWORD: password,
    ASKPASS_MAIN: getAskPassScriptPath(),
    GIT_ASKPASS: getAskPassTrampolinePath()
  }
}

export function setupNoAuth(): Object {
  return {
    // supported since Git 2.3, this is used to ensure we never interactively prompt
    // for credentials - even as a fallback
    GIT_TERMINAL_PROMPT: '0'
  }
}