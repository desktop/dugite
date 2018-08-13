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
    config.checksum = '9856da255c89ab4954bd336f8b7e757babf6f8ec6c15d5b594b002440834b779'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-3/dugite-native-v2.18.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'a29d099b4463d43ca056beb0dbbfc1b7cccf894c13812fb0c65227cb1289e78b'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-3/dugite-native-v2.18.0-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = 'be04e349f1cf842e5794e094ef11012e4837996ec334fc68a7c3efe9f320818a'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-3/dugite-native-v2.18.0-arm64.tar.gz'
    } else {
      config.checksum = 'e6405a1ab0e39a265526c95a14bb780d9b694ce612d526f695529416451b53b7'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-3/dugite-native-v2.18.0-ubuntu.tar.gz'
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
