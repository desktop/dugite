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
    config.checksum = 'd2d5bb887dad10571f61fa7aaa52bc48f6ebe4b97fc4a37377565e879a3b39af'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0/dugite-native-v2.16.0-macOS-68.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '203902c9e3d29270d224e9d0ed3b4524fb34c65a825eb7b95bfd5e6c6cf568df'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0/dugite-native-v2.16.0-win32-68.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '4ba9bfb3170e32351555f715feb8f9bd57b05a420c730d496be264e48fece1c7'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.0/dugite-native-v2.16.0-ubuntu-68.tar.gz'
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
