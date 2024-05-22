import assert from 'assert'
import { GitProcess } from '../../lib'
import * as os from 'os'
import { describe, it } from 'node:test'

describe('config', () => {
  it('sets http.sslBackend on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await GitProcess.exec(
        ['config', '--system', 'http.sslBackend'],
        os.homedir()
      )
      assert.equal(result.stdout.trim(), 'schannel')
    }
  })

  it('unsets http.sslCAInfo on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await GitProcess.exec(
        ['config', '--system', 'http.sslCAInfo'],
        os.homedir()
      )
      assert.equal(result.stdout.trim(), '')
    }
  })
})
