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
    config.checksum = '372c45d899b6ab73ff545b7ab73f9b656d4a05dcff4e8e11bb3bd7ef2a727a14'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.0-rc1/dugite-native-v2.15.0-macOS-25.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'a54b64be0976c3f919a52d4dd6dcfb9434744072860df980767d662275a9f235'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.0-rc1/dugite-native-v2.15.0-win32-25.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '7e7f2c78b994017026c4ce2d999fad25501a5a33b6c2c0c11684f58d3ccfc06b'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.15.0-rc1/dugite-native-v2.15.0-ubuntu-25.tar.gz'
  }

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

  return config
}

module.exports = getConfig
