import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'
import { setupEnvironment } from '../../lib/git-environment'

const temp = require('temp').track()

describe('environment variables', () => {
  it('can set them', async () => {
    const testRepoPath = temp.mkdirSync('desktop-git-test-environment')
    const result = await GitProcess.exec([ 'var', 'GIT_AUTHOR_IDENT' ], testRepoPath, {
      env: {
        'GIT_AUTHOR_NAME': 'Foo Bar',
        'GIT_AUTHOR_EMAIL': 'foo@bar.com',
        'GIT_AUTHOR_DATE': 'Wed, 05 Oct 2016 23:33:27 +0200',
      }
    })
    expect(result.stdout).to.equal('Foo Bar <foo@bar.com> 1475703207 +0200\n')
  })

  it('when GIT_EXEC_PATH environment variable is *not* set, it will be calculated', async () => {
    expect(process.env.GIT_EXEC_PATH).to.be.undefined
    const { env } = await setupEnvironment({})
    expect((<any>env)['GIT_EXEC_PATH']).not.to.be.undefined
  })

  it('when GIT_EXEC_PATH environment variable is set, that will be used as is', async () => {
    expect(process.env.GIT_EXEC_PATH).to.be.undefined
    try {
      process.env.GIT_EXEC_PATH = __filename
      const { env } = await setupEnvironment({})
      expect((<any>env)['GIT_EXEC_PATH']).to.be.equal(__filename)
    } finally {
      delete process.env.GIT_EXEC_PATH
    }
  })
})
