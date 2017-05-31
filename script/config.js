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
    config.checksum = '3489eeeddf6e69cead1462dee63b4c1c9b56038aad7da489964aec10a8a0fa32'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc2/dugite-native-v2.13.0-macOS-188.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '0b71a1248cc01994d1de1b304309f1160027283dc7d7ac928b8074e0e95e8828'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc2/dugite-native-v2.13.0-win32-188.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '29743b174c3abf9670b14ca3430a98941c4e271729565c871b62544c2362bc04'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc2/dugite-native-v2.13.0-ubuntu-188.tar.gz'
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
