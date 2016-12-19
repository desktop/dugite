import { GitProcess } from '../lib'

const temp = require('temp').track()

export async function initalize(repositoryName: string) : Promise<string> {
  const testRepoPath = temp.mkdirSync(`desktop-git-test-${repositoryName}`)
  await GitProcess.exec([ 'init' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.email', '"some.user@email.com"' ], testRepoPath)
  await GitProcess.exec([ 'config', 'user.name', '"Some User"' ], testRepoPath)

  return testRepoPath
}
