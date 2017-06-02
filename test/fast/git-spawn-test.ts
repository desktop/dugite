import * as chai from 'chai'
const expect = chai.expect

import { ChildProcess } from 'child_process'
import { GitProcess} from '../../lib'

import { gitVersion } from '../helpers'

function bufferOutput(process: ChildProcess): Promise<string> {
  return new Promise<string>((resolve) => {
    const stdout: Array<Buffer> = []
    process.stdout.on('data', (chunk) => {
      if (chunk instanceof Buffer) {
        stdout.push(chunk)
      } else {
        stdout.push(Buffer.from(chunk))
      }
    })
    process.on('exit', () => {
      resolve(Buffer.concat(stdout).toString())
    })
  })
}

describe('GitProcess.spawn', () => {
  it('can launch git', async () => {
    const process = await GitProcess.spawn([ '--version' ], __dirname)
    const result = await bufferOutput(process)
    expect(result).to.contain(`git version ${gitVersion}`)
  })
})
