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
    config.checksum = '2a9a87061682bb122ac5ef926d3054fd141465f93d2edbfcb8318fa778333c53'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.2-1/dugite-native-v2.16.2-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '9b2e544e926d9c5550838fa53936172cc442f8e647a557dc1e1f2270e68afead'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.2-1/dugite-native-v2.16.2-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = 'e2aec5fb57946b7ad96371bc030e877801f13b98dffec4e20e28bb6a4b7e0a3d'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.16.2-1/dugite-native-v2.16.2-arm64.tar.gz'
    } else {
      config.checksum = 'c02e93321532479a9d5219b7598c0d50d7045ed41c0bb1a928940f2d87494f54'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.16.2-1/dugite-native-v2.16.2-ubuntu.tar.gz'
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
