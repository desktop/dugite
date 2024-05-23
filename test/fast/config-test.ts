import { join, resolve } from 'path'
import { GitProcess, resolveGitDir } from '../../lib'
import * as os from 'os'

describe('config', () => {
  it('sets http.sslBackend on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await GitProcess.exec(
        ['config', '--system', 'http.sslBackend'],
        os.homedir()
      )
      expect(result.stdout.trim()).toBe('schannel')
    }
  })

  it('unsets http.sslCAInfo on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await GitProcess.exec(
        ['config', '--system', 'http.sslCAInfo'],
        os.homedir()
      )
      expect(result.stdout.trim()).toBe('')
    }
  })

  it('turns on useHttpPath for Azure Devops', async () => {
    const result = await GitProcess.exec(
      ['config', '--system', 'credential.https://dev.azure.com.useHttpPath'],
      os.homedir()
    )
    expect(result.stdout.trim()).toBe('true')
  })

  it('uses the custom system config from dugite-native', async () => {
    if (process.platform !== 'win32') {
      const result = await GitProcess.exec(
        ['config', '--show-origin', '--system', 'include.path'],
        os.homedir()
      )
      const [origin, value] = result.stdout.trim().split('\t')

      const originPath = origin.substring('file:'.length)

      expect(resolve(originPath)).toBe(
        join(resolveGitDir(process.env), 'etc', 'gitconfig')
      )

      expect(value).toBe('/etc/gitconfig')
    }
  })
})
