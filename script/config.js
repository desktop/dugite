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
    config.checksum = '30eb68d28bbb9c88e644ad3c025c4e0bbf43b77317a346d342c449a52143b1a7'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.1/dugite-native-v2.16.1-macOS-75.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '856b5ff7b791210b5bf8f3a9daab03be02b020823c568ef2aa60f906c1a978e6'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.1/dugite-native-v2.16.1-win32-75.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'fefb2675957a2b878eb792b176ef801058772679e8472af9585b02521656509e'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.1/dugite-native-v2.16.1-ubuntu-75.tar.gz'
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
