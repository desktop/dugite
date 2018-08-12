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
    config.checksum = '4d6a3f410617a9c5d2b9df5ffc4717ddf314167ba22ea11349198894f35e4391'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-2/dugite-native-v2.18.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'ae76a27123657ca521d72618ebff0ae1e6b55af6c21deed4ef9345eaae18fb3b'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-2/dugite-native-v2.18.0-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '26754bf876e24d93100c55a760df22adf10a47f45bcaccdfbf6b7c073f6633d8'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-2/dugite-native-v2.18.0-arm64.tar.gz'
    } else {
      config.checksum = '38c865df026552284266211f96cde4ccbc145cb813a0d5651ada5fd704a881fd'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-2/dugite-native-v2.18.0-ubuntu.tar.gz'
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
