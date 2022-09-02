import { GitProcess, IGitExecutionOptions } from '../lib/'
import { ChildProcess } from 'child_process'

const byline = require('byline')
const ProgressBar = require('progress')

const progressBarOptions = {
  complete: '=',
  incomplete: ' ',
  width: 50,
  total: 100,
}

function tryParse(str: string): number | null {
  const value = /(\d+)\%/.exec(str)
  if (value) {
    const percentValue = value[1]
    const percent = parseInt(percentValue, 10)
    if (!isNaN(percent)) {
      return percent
    }
  }

  return null
}

let receivingObjectsBar: any = null
function setReceivingProgress(percent: number) {
  if (!receivingObjectsBar) {
    receivingObjectsBar = new ProgressBar(
      'Receiving objects [:bar] :percent',
      progressBarOptions
    )
  }

  receivingObjectsBar.update(percent / 100)
}

let resolvingDeltasBar: any = null
function setResolvingProgress(percent: number) {
  if (!resolvingDeltasBar) {
    resolvingDeltasBar = new ProgressBar(
      'Resolving deltas [:bar] :percent',
      progressBarOptions
    )
  }

  resolvingDeltasBar.update(percent / 100)
}

async function performClone(): Promise<void> {
  const path = 'C:/some/path/on/disk'

  const options: IGitExecutionOptions = {
    // enable diagnostics
    env: {
      GIT_HTTP_USER_AGENT: 'dugite/2.12.0',
    },
    processCallback: (process: ChildProcess) => {
      byline(process.stderr).on('data', (chunk: string) => {
        if (chunk.startsWith('Receiving objects: ')) {
          const percent = tryParse(chunk)
          if (percent) {
            setReceivingProgress(percent)
          }
          return
        }

        if (chunk.startsWith('Resolving deltas: ')) {
          const percent = tryParse(chunk)
          if (percent) {
            setResolvingProgress(percent)
          }
          return
        }
      })
    },
  }

  const result = await GitProcess.exec(
    ['clone', 'https://github.com/dugite/dugite', '--progress'],
    path,
    options
  )
  if (result.exitCode !== 0) {
    console.log(`Unable to clone, exit code ${result.exitCode}`)
    console.log(result.stderr)
  } else {
    console.log('Clone completed')
  }
}

performClone()
