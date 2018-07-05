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
    config.checksum = 'e82484a5a0c14e974c7f084c5332fdce9089245169a8f7f68b24cfb299a4e596'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0/dugite-native-v2.18.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'f1f67fe35b15c4060862959c023b8f4bcfa8128be9b8e990bb161e1a4e555a53'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0/dugite-native-v2.18.0-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '02302c14eac536f186a8850ddf43dcf1be082a4bd0d45479658170d8f6f4e6ab'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0/dugite-native-v2.18.0-arm64.tar.gz'
    } else {
      config.checksum = 'f623ce8256e68f6291a2878786422e65bc82d86f845ce7ea67eedad91f9ca281'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0/dugite-native-v2.18.0-ubuntu.tar.gz'
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
