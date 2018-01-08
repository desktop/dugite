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
    config.checksum = '1220641b224bd087e5d1466a7038576fd11f88657383dc573d7d17fc2b59a6a5'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc1/dugite-native-v2.16.0-rc1-macOS-62.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '52660131b71f20b202eba9bb1585e24ace08b614e5bc9ee30e2079aaf35025b7'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc1/dugite-native-v2.16.0-rc1-win32-62.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '8f7efa8524ce6bab2ba733b64e5f9adff494494319f31f708fb822a759a1b674'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc1/dugite-native-v2.16.0-rc1-ubuntu-62.tar.gz'
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
