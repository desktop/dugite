import { describe, it } from 'node:test'
import { ExecError, exec as git } from '../../lib'
import assert from 'node:assert'

describe('maxBuffer', () => {
  it('truncates stdout', async () => {
    const { stdout } = await git(['--version'], process.cwd(), {
      maxBuffer: 3,
    }).catch(e =>
      e instanceof ExecError && e.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
        ? Promise.resolve({
            stdout: e.stdout.toString('utf8'),
            stderr: e.stderr.toString('utf8'),
            exitCode: 0,
          })
        : Promise.reject(e)
    )

    assert.equal(stdout, 'git')
  })
})
