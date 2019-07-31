const URL = require('url')
const path = require('path')
const os = require('os')
const fs = require('fs')

const embeddedGit = require('./embedded-git.json')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  const targetArch = process.env.DUGITE_DOWNLOAD_ARCH || os.arch()
  const key = `${process.platform}-${targetArch}`

  const entry = embeddedGit[key]

  if (entry != null) {
    config.checksum = entry.checksum
    config.source = entry.url
  } else {
    console.log(`No embedded Git found for ${process.platform} and architecture ${os.arch()}`)
  }

  if (config.source !== '') {
    // compute the filename from the download source
    const url = URL.parse(config.source)
    const pathName = url.pathname
    const index = pathName.lastIndexOf('/')
    config.fileName = pathName.substr(index + 1)

    const cacheDirEnv = process.env.DUGITE_CACHE_DIR

    const cacheDir = cacheDirEnv ? path.resolve(cacheDirEnv) : os.tmpdir()

    try {
      fs.statSync(cacheDir)
    } catch (e) {
      fs.mkdirSync(cacheDir)
    }

    config.tempFile = path.join(cacheDir, config.fileName)
  }

  return config
}

module.exports = getConfig
