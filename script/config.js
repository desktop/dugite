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
    config.checksum = '65d608eb16e0e262bae6bd7828b28cf640455e949003fec94c1233e084b9ccde'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.2/dugite-native-v2.16.2-macOS-119.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'c84d31baa8d5c782bbf2a421c0231895c8515b09f698653d70e491b4ffdc1db3'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.2/dugite-native-v2.16.2-win32-119.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '831dddd2381bb7a85f45b35911f123d062a2bdacf2116181503a1293e58a6e79'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.16.2/dugite-native-v2.16.2-ubuntu-119.tar.gz'
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
