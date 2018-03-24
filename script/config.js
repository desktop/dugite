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
    config.checksum = '7332344da4c0d606e41a6618f8c98f9deee892dc47308f57a48900ef51c870a1'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.3/dugite-native-v2.16.3-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'b4a22f4f1fcdc95a04bcedf2fd0c67d1a9201a44769143fe998c3bb7329f00ea'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.3/dugite-native-v2.16.3-win32.tar.gz'
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '73e636879ef8156adfd2ae8813271d4b4df1efcf5fc6c8f8e1b8fb1271250c4e'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.16.3/dugite-native-v2.16.3-arm64.tar.gz'
    } else {
      config.checksum = '54e9a6f8790d8d2923dafe2205bcac833f52269d094d145f874db36b6a22e78a'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.16.3/dugite-native-v2.16.3-ubuntu.tar.gz'
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
