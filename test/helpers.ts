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
  const path = Path.join(projectRoot, 'build', 'test', 'auth', `main.js`)
  console.log(`script path: ${path}`)
  return path
}

function getAskPassTrampolinePath(): string {
  const isWindows = process.platform === 'win32'
  const extension = isWindows ? 'bat' : 'sh'
  const path = Path.resolve(__dirname, 'auth', `ask-pass.${extension}`)
  console.log(`trampoline: ${path}`)
  return path
}

export function setupAskPass(username: string, password: string): Object {
  return { 
    TEST_USERNAME: username,
    TEST_PASSWORD: password,
    ASKPASS_MAIN: getAskPassScriptPath(),
    GIT_ASKPASS: getAskPassTrampolinePath()
  }
}