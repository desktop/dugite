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
    config.checksum = '56725f902855773bd63f727524fcf7b1d3d586000f7886abd54b77f224cb5a8d'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'f439ce2b853dece6ae1b3d9d6861ba70184bad414445958a8020c0caf30fd787'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.17.1-2/dugite-native-v2.17.1-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '61004e33e16b310c403644fb2723b9db780094a5bacb08cc8c9e76146d7b932a'
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
