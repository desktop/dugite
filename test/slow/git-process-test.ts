import * as Fs from 'fs'
import * as Path from 'path'

import { exec, GitError, parseError } from '../../lib'
import { createTestDir, initialize, verify } from '../helpers'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { createServer } from 'http'
import assert from 'assert'
import { describe, it } from 'node:test'

describe('git-process', () => {
  describe('clone', () => {
    it("returns exit code when repository doesn't exist", async t => {
      const testRepoPath = await createTestDir(t, 'desktop-git-test-blank')

      const result = await exec(
        [
          'clone',
          '--',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
          '.',
        ],
        testRepoPath
      )

      verify(result, r => {
        assert.equal(r.exitCode, 128)
      })
    })

    it('returns exit code and error when repository requires credentials', async t => {
      const testRepoPath = await createTestDir(t, 'desktop-git-test-blank')
      const options = {
        env: {
          GIT_CONFIG_PARAMETERS: "'credential.helper='",
          GIT_TERMINAL_PROMPT: '0',
          GIT_ASKPASS: undefined,
        },
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
        verify(result, r => {
          assert.equal(r.exitCode, 128)
        })

        const error = parseError(result.stderr)
        assert.equal(error, GitError.HTTPSAuthenticationFailed)
      } finally {
        server.close()
      }
    })
  })

  describe('fetch', () => {
    it("returns exit code when repository doesn't exist", async t => {
      const testRepoPath = await initialize(t, 'desktop-git-fetch-failure')

      const addRemote = await exec(
        [
          'remote',
          'add',
          'origin',
          pathToFileURL(resolve('i-for-sure-donut-exist')).toString(),
        ],
        testRepoPath
      )
      verify(addRemote, r => {
        assert.equal(r.exitCode, 0)
      })
      const result = await exec(['fetch', 'origin'], testRepoPath)
      verify(result, r => {
        assert.equal(r.exitCode, 128)
      })
    })
  })

  describe('checkout', () => {
    it('runs hook without error', async t => {
      const testRepoPath = await initialize(
        t,
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
      verify(result, r => {
        assert.equal(r.exitCode, 0)
        assert.ok(
          r.stderr.includes('post-check out hook ran'),
          'Expected hook to run'
        )
      })
    })
  })
})
