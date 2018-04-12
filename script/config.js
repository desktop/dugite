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
    config.checksum = 'bb2b90cf4ccebc22e99f07043ce8a9197737d07693c78fe237ab432d68f95569'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.0/dugite-native-v2.17.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '239c4e7aa06f5136c8796db0236541a989f7ae50f7a16a3293d8ad3083fb701a'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.0/dugite-native-v2.17.0-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '54018ec6b8b0d3575e5ac1e735425407f176734dd5cb80fd148f9b66219cf95e'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.0/dugite-native-v2.17.0-arm64.tar.gz'
    } else {
      config.checksum = '4e9b99f8d032634cccf11e318d9b7d1af4649eec0e60499882a27b2434d8828a'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.0/dugite-native-v2.17.0-ubuntu.tar.gz'
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
