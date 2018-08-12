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
    config.checksum = '841079b5718d96103868914d98a17bff037bb09d8b55772dc7f0a7f1861142a2'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-1/dugite-native-v2.18.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '08253a895610d0ef08b8f56e7b1a097ca396f9e87fe744d350aae52dde7ac0ca'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-1/dugite-native-v2.18.0-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '1a1da5718480456e4d41e43632cdccaa249c7deb05c3d717ba73d885e92f61f3'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-1/dugite-native-v2.18.0-arm64.tar.gz'
    } else {
      config.checksum = '5804000001eb8dd0eb642869541bd51f0a3f8aa7639aa44a55bd579d3042ffca'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-1/dugite-native-v2.18.0-ubuntu.tar.gz'
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
