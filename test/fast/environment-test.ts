// This shouldn't be necessary, but without this CI fails on Windows. Seems to
// be a bug in TS itself or ts-node.
/// <reference path="../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import * as chai from 'chai'
const expect = chai.expect

import { GitProcess } from '../../lib'

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
})
