import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'
import * as os from 'os'

describe('config', () => {

  it('sets http.sslBackend on Windows', async () => {
    if (process.platform === 'win32') {
      const result = await GitProcess.exec([ 'config', '--global', 'http.sslBackend' ], os.homedir())
      expect(result.stdout).to.equal('schannel')
    }
  })
})