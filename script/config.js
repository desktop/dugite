const URL = require('url')
const path = require('path')
const os = require('os')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  if (process.platform === 'darwin') {
    config.checksum = '1a145960b6cce2d52eb0510bee1e77c4a0fe56ee5ef24e7def6f6d3bb4b5a2f1'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.3-rc1/dugite-native-v2.14.3-macOS-23.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'db14ddc1281606b001a44b70f2fc3deda6e60686de06d135056205216c2a5663'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.3-rc1/dugite-native-v2.14.3-win32-23.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'e700fd77cfbda94b43af95a1f84c4e85a113dffb22dd3c14d40188a6a46216a9'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.3-rc1/dugite-native-v2.14.3-ubuntu-23.tar.gz'
  }

  // compute the filename from the download source
  const url = URL.parse(config.source)
  const pathName = url.pathname
  const index = pathName.lastIndexOf('/')
  config.fileName = pathName.substr(index + 1)

  const dir = os.tmpdir()
  config.tempFile = path.join(dir, config.fileName)

  return config
}

module.exports = getConfig
