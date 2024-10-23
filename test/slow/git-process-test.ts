import * as Fs from 'fs'
import * as Path from 'path'

import { exec, GitError, parseError } from '../../lib'
import { initialize, verify } from '../helpers'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { createServer } from 'http'
import { track } from 'temp'
import assert from 'assert'
import { describe, it } from 'node:test'

const temp = track()

describe('git-process', () => {
  describe('clone', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')

      const result = await exec(
        [
          'clone',
          '--',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
          '.',
        ],
        testRepoPath,
        { ignoreExitCodes: [128] }
      )

      assert.equal(result.exitCode, 128)
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: {
          GIT_CONFIG_PARAMETERS: "'credential.helper='",
          GIT_TERMINAL_PROMPT: '0',
          GIT_ASKPASS: undefined,
        },
        ignoreExitCodes: [128],
      }

      const server = createServer((req, res) => {
        res.writeHead(401, {
          'Content-Type': 'text/plain',
          'WWW-Authenticate': 'Basic realm="foo"',
        })
        res.end()
      })

      const port = await new Promise<number>((resolve, reject) => {
        server.listen(0, () => {
          const addr = server.address()
          if (addr === null || typeof addr === 'string') {
            reject(new Error('invalid server address'))
          } else {
            resolve(addr.port)
          }
        })
      })

      try {
        const result = await exec(
          ['clone', '--', `http://foo:bar@127.0.0.1:${port}/`, '.'],
          testRepoPath,
          options
        )

        assert.equal(result.exitCode, 128)

        const error = parseError(result.stderr.toString())
        assert.equal(error, GitError.HTTPSAuthenticationFailed)
      } finally {
        server.close()
      }
    })
  })

  describe('fetch', () => {
    it("returns exit code when repository doesn't exist", async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')

      await exec(
        [
          'remote',
          'add',
          'origin',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
        ],
        testRepoPath
      )
      const result = await exec(['fetch', 'origin'], testRepoPath, {
        ignoreExitCodes: [128],
      })
      assert.equal(result.exitCode, 128)
    })
  })

  describe('checkout', () => {
    it('runs hook without error', async () => {
      const testRepoPath = await initialize(
        'desktop-git-checkout-hooks',
        'main'
      )
      const readme = Path.join(testRepoPath, 'README.md')

      Fs.writeFileSync(readme, '# README', { encoding: 'utf8' })

      await exec(['add', '.'], testRepoPath)
      await exec(['commit', '-m', '"added README"'], testRepoPath)

      await exec(['checkout', '-b', 'some-other-branch'], testRepoPath)

      const postCheckoutScript = `#!/bin/sh
echo 'post-check out hook ran'`
      const postCheckoutFile = Path.join(
        testRepoPath,
        '.git',
        'hooks',
        'post-checkout'
      )

      Fs.writeFileSync(postCheckoutFile, postCheckoutScript, {
        encoding: 'utf8',
        mode: '755',
      })

      const result = await exec(['checkout', 'main'], testRepoPath)
      assert.equal(result.exitCode, 0)
      assert.ok(
        result.stderr.includes('post-check out hook ran'),
        'Expected hook to run'
      )
    })
  })
})
