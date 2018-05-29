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
    config.checksum = '318314be05ec63cacf733cbc232025a1a8cd75c79b7537ff6f62a858b6c3610f'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1/dugite-native-v2.17.1-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '14079ad554a215fe707fe64dc3afa041a23d8d846817938f0bacebabe0a61267'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1/dugite-native-v2.17.1-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '386d63ded1066f22950a6fce2f96e32f85c6d5d93b9db7528fdbe5b694d15c2e'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1/dugite-native-v2.17.1-arm64.tar.gz'
    } else {
      config.checksum = '6354310e77c02397e796275276dd119267904c9e9fb6873f4b35a2785cfd5851'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1/dugite-native-v2.17.1-ubuntu.tar.gz'
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
