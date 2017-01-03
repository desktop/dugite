import * as path from 'path'
import * as fs from 'fs'

const tmpdir = require('os-tmpdir')

import { Archiver } from './archiver'
import { Downloader } from './downloader'
import { Config } from './config'
import { cleanupAll } from './cleanup-all'

const fail = (error: Error) => {
  const message = error.message || error
  console.error(message)
  process.exit(1)
}

if (process.argv.length < 2) {
  console.log('node ./package.js [win32|darwin|linux]')
  process.exit(-1)
}

const platform = process.argv[2]

const dir = tmpdir()
const root = path.join(dir, 'git-kitchen-sink')

function formatPlatform(platform: string): string {
  if (platform === 'linux') {
    return 'ubuntu'
  }
  return platform
}

if (!fs.existsSync(root)) {
  fs.mkdirSync(root)
}

Config.getConfig(platform)
  .then(config => {
    if (!config) {
      return Promise.reject(`unhandled platform found: ${platform}`)
    } else {

      let outputPlatform = formatPlatform(platform)
      const temporaryGitDirectory = path.join(root, outputPlatform, config.git.version)
      const destinationFile = `git-kitchen-sink-${outputPlatform}-v${config.outputVersion}.tgz`
      const destination = path.join(root, destinationFile)

      return cleanupAll(temporaryGitDirectory)
        .then(() => Downloader.downloadGit(config, root))
        .then(() => Downloader.downloadGitLFS(config, root))
        .then(() => Archiver.unpackAll(outputPlatform, config, root))
        .then(() => Archiver.create(temporaryGitDirectory, destination))
        .then(() => Archiver.output(destination))
    }
  })
  .catch(err => fail(err))
