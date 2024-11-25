import * as Path from 'path'
import { ChildProcess } from 'child_process'

import { createTestDir, gitForWindowsVersion, gitVersion } from '../helpers'
import assert from 'assert'
import { describe, it } from 'node:test'
import { appendFile } from 'fs/promises'
import { exec, spawn } from '../../lib'

const maximumStringSize = 268435441

function bufferOutput(
  process: ChildProcess,
  failPromiseWhenLengthExceeded: boolean = true
) {
  return new Promise<string>((resolve, reject) => {
    const stdout: Array<Buffer> = []
    process.stdout?.on('data', chunk => {
      if (chunk instanceof Buffer) {
        stdout.push(chunk)
      } else {
        stdout.push(Buffer.from(chunk))
      }
    })
    process.on('exit', () => {
      const output = Buffer.concat(stdout)
      if (failPromiseWhenLengthExceeded && output.length >= maximumStringSize) {
        reject(
          new Error(
            `Process output is greater than known V8 limit on string size: ${maximumStringSize} bytes`
          )
        )
      } else {
        resolve(output.toString())
      }
    })
  })
}

describe('spawn', () => {
  it('can launch git', async () => {
    const process = spawn(['--version'], __dirname)
    const result = await bufferOutput(process)
    const version = result.includes('windows')
      ? gitForWindowsVersion
      : gitVersion
    const expected = `git version ${version}`

    assert.ok(
      result.includes(expected),
      `Expected git version to contain ${expected}, got: ${result}`
    )
  })

  it('returns expected exit codes', async t => {
    const directory = await createTestDir(t, 'desktop-not-a-repo')
    const process = spawn(['status'], directory)
    const code = await new Promise<number | null>(resolve => {
      process.on('exit', code => {
        resolve(code)
      })
    })

    assert.notEqual(code, 0)
  })

  it('can fail safely with a diff exceeding the string length', async t => {
    const testRepoPath = await createTestDir(t, 'desktop-git-spwawn-empty')

    exec(['init'], testRepoPath)

    // write this file in two parts to ensure we don't trip the string length limits
    const filePath = Path.join(testRepoPath, 'file.txt')

    const pointInTime = 100000000
    const firstBufferLength = maximumStringSize - pointInTime
    const secondBufferLength = pointInTime

    const firstBuffer = Buffer.alloc(firstBufferLength)
    firstBuffer.fill('a')
    const secondBuffer = Buffer.alloc(secondBufferLength)
    secondBuffer.fill('b')

    await appendFile(filePath, firstBuffer)
    await appendFile(filePath, secondBuffer)

    const process = spawn(
      [
        'diff',
        '--no-index',
        '--patch-with-raw',
        '-z',
        '--',
        '/dev/null',
        'file.txt',
      ],
      testRepoPath
    )

    await assert.rejects(bufferOutput(process), 'Expected diff to fail')
  })
})
