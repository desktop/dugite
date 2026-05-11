import { describe, it } from 'node:test'
import { ExecError, exec as git } from '../../lib'
import assert from 'node:assert'

describe('maxBuffer', () => {
  it('truncates stdout', async () => {
    const e = await git(['-v'], process.cwd(), { maxBuffer: 3 }).catch(e => e)

    assert.ok(e instanceof ExecError)
    assert.equal(e.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER')
    assert.equal(e.stdout.toString(), 'git')
  })
})
