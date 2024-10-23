import assert from 'assert'
import { exec, resolveGitDir } from '../../lib'
import { join, resolve } from 'path'
import * as os from 'os'
import { describe, it } from 'node:test'

describe('config', () => {
  it('sets http.sslBackend on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await exec(
        ['config', '--system', 'http.sslBackend'],
        os.homedir()
      )
      assert.equal(result.stdout.trim(), 'schannel')
    }
  })

  it('unsets http.sslCAInfo on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await exec(
        ['config', '--system', 'http.sslCAInfo'],
        os.homedir(),
        { ignoreExitCodes: [1] }
      )
      assert.equal(result.exitCode, 1)
      assert.equal(result.stdout.trim(), '')
    }
  })

  it('turns on useHttpPath for Azure Devops', async () => {
    const result = await exec(
      ['config', '--system', 'credential.https://dev.azure.com.useHttpPath'],
      os.homedir()
    )
    assert.equal(result.stdout.trim(), 'true')
  })

  it('uses the custom system config from dugite-native', async () => {
    if (process.platform !== 'win32') {
      const result = await exec(
        ['config', '--show-origin', '--system', 'include.path'],
        os.homedir()
      )
      const [origin, value] = result.stdout.trim().split('\t')

      const originPath = origin.substring('file:'.length)

      assert.equal(
        resolve(originPath),
        join(resolveGitDir(), 'etc', 'gitconfig')
      )

      assert.equal(value, '/etc/gitconfig')
    }
  })
})
