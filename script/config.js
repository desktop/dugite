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
    config.checksum = 'c7c0e93ae0a20e1696984248d7449754c9a17fe0a6b926591e2f28310110419a'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.1-rc0/dugite-native-v2.15.1-macOS-28.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '1e6537c6129af5f067e5d050a217f4a9beade87958db8d7e0745f8a8887596a4'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.1-rc0/dugite-native-v2.15.1-win32-28.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '39b70a9bce0619ad03000446c19835bb58622c5c198e8185237ba9f0688ee494'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.1-rc0/dugite-native-v2.15.1-ubuntu-28.tar.gz'
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
