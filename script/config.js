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
    config.checksum = 'b816e814568d2309c50d1abe0df7516b41301d24e9bb4504906e9287d56a24ac'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc0/dugite-native-v2.16.0-rc0-macOS-59.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'ec038b63bf73f3d020dd8afe868076cbc705766d5297d3e2afae56b8203870b7'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc0/dugite-native-v2.16.0-rc0-win32-59.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '152ea2889b6b3bd8dffab455b5c14078ff7a1e395c9ac567ddb5879737c92991'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0-rc0/dugite-native-v2.16.0-rc0-ubuntu-59.tar.gz'
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
