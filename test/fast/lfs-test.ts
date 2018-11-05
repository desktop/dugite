import { GitProcess } from '../../lib'
import { gitLfsVersion } from '../helpers'

const temp = require('temp').track()

describe('lfs', () => {
  it('can be resolved', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec(['lfs'], testRepoPath)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Git LFS is a system for managing and versioning large files')
  })

  it('matches the expected version', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-lfs')
    const result = await GitProcess.exec(['lfs', 'version'], testRepoPath)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain(`git-lfs/${gitLfsVersion} `)
  })
})
