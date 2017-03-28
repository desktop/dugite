const URL = require('url')
const path = require('path')
const tmpdir = require('os-tmpdir')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  if (process.platform === 'darwin') {
    config.checksum = '75a0d7d9bf743bc2dc2e2dfa815be39c14b5e6c7d480a10934f1f2b74cc3875e'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-macOS-145.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '6d82f4361ecb78fb1556a8c2f54711c1b76b301007a2000393cea34d363d2dcf'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-win32-145.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'dfed95bb0bb905627cfccca7d9462a551129ea70ff20525cb85b88011d0fd513'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-ubuntu-145.tar.gz'
  }

  // compute the filename from the download source
  const url = URL.parse(config.source)
  const pathName = url.pathname
  const index = pathName.lastIndexOf('/')
  config.fileName = pathName.substr(index + 1)

  const dir = tmpdir()
  config.tempFile = path.join(dir, config.fileName)

  return config
}

module.exports = getConfig
