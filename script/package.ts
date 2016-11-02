import * as path from 'path'
import * as fs from 'fs'

const tmpdir = require('os-tmpdir')

import { Downloader, Archiver, FileOperations, Config } from './functions'

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

if (!fs.existsSync(root)) {
  fs.mkdirSync(root)
}

Config.getConfig(platform)
  .then(config => {
    if (!config) {
      return Promise.reject(`unhandled platform found: ${platform}`)
    } else {

      const temporaryGitDirectory = path.join(root, platform, config.git.version)
      const destinationFile = `git-kitchen-sink-${platform}-v${config.outputVersion}.tgz`
      const destination = path.join(root, destinationFile)

      return FileOperations.cleanupAll(temporaryGitDirectory)
        .then(() => Downloader.downloadGit(config, root))
        .then(() => Downloader.downloadGitLFS(config!, root))
        .then(() => Archiver.unpackAll(platform, config!, root))
        .then(() => Archiver.create(temporaryGitDirectory, destination))
        .then(() => Archiver.output(destination))
    }
  })
  .catch(err => fail(err))
