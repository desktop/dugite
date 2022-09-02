import * as Fs from 'fs'
import * as Path from 'path'

import { ChildProcess } from 'child_process'
import { GitProcess } from '../../lib'

import { gitForWindowsVersion, gitVersion } from '../helpers'
const temp = require('temp').track()

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

describe('GitProcess.spawn', () => {
  it('can launch git', async () => {
    const process = GitProcess.spawn(['--version'], __dirname)
    const result = await bufferOutput(process)
    if (result.includes('windows')) {
      expect(result).toContain(`git version ${gitForWindowsVersion}`)
    } else {
      expect(result).toContain(`git version ${gitVersion}`)
    }
  })

  it('returns expected exit codes', done => {
    const directory = temp.mkdirSync('desktop-not-a-repo')
    const process = GitProcess.spawn(['status'], directory)
    process.on('exit', (code, signal) => {
      if (code === 0) {
        done(new Error('the exit code returned was zero which was unexpected'))
      } else {
        done()
      }
    })
  })

  it('can fail safely with a diff exceeding the string length', done => {
    const testRepoPath = temp.mkdirSync('desktop-git-spwawn-empty')

    GitProcess.exec(['init'], testRepoPath)

    // write this file in two parts to ensure we don't trip the string length limits
    const filePath = Path.join(testRepoPath, 'file.txt')

    const pointInTime = 100000000
    const firstBufferLength = maximumStringSize - pointInTime
    const secondBufferLength = pointInTime

    const firstBuffer = Buffer.alloc(firstBufferLength)
    firstBuffer.fill('a')
    const secondBuffer = Buffer.alloc(secondBufferLength)
    secondBuffer.fill('b')

    Fs.appendFileSync(filePath, firstBuffer.toString('utf-8'))
    Fs.appendFileSync(filePath, secondBuffer.toString('utf-8'))
    const process = GitProcess.spawn(
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

    bufferOutput(process)
      .then(o => {
        done(
          new Error('The diff was returned as-is, which should never happen')
        )
      })
      .catch(err => {
        done()
      })
  })
})
