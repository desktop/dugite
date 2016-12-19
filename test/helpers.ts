import * as Path from 'path'

import { GitProcess } from '../lib'

const temp = require('temp').track()

export async function initalize(repositoryName: string) : Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  await GitProcess.exec([ 'init' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.email', '"some.user@email.com"' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.name', '"Some User"' ], testRepoPath)
  return testRepoPath
}

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
    TEST_USERNAME: username,
    TEST_PASSWORD: password,
    ASKPASS_MAIN: getAskPassScriptPath(),
    GIT_ASKPASS: getAskPassTrampolinePath()
  }
}