const URL = require('url')
const path = require('path')
const os = require('os')
const fs = require('fs')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  if (process.platform === 'darwin') {
    config.checksum = '364faf657cd613bcb8d33ed76451def2e8002a9e7d78182e065800c048a39dbe'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-3/dugite-native-v2.17.1-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '32364490a9df3baf0ef9dbf56eed14afdd12b6262e887fe324a7246913e439df'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-3/dugite-native-v2.17.1-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = 'b4485088c32b9955fcbe119e0d12a4b35507f41a6cfa837925de5ab25404cbc7'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1-3/dugite-native-v2.17.1-arm64.tar.gz'
    } else {
      config.checksum = '55fc79b5ebc4d216057ab4b3dd7bb98b8cd668ab6d6abf53b8daa9542a10d7ee'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1-3/dugite-native-v2.17.1-ubuntu.tar.gz'
    }
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
