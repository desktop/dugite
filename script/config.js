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
    config.checksum = 'f92ff67688ddc9ce48ba50e9e9ed8cf49e958a697ca2571edce898a4b9dae474'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '6a7f166a8211c60d724cc23ef378a059375a67f1c352f5a44846dd0c84285f30'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '37ae118c9ceddc5212c747eb539430a776e3a9a59407f8b14a558295897ca7c0'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-arm64.tar.gz'
    } else {
      config.checksum = 'a3750dade1682d1805623661e006f842c6bbf9cc4e450ed161e49edeb2847a86'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-ubuntu.tar.gz'
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
