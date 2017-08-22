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
    config.checksum = '700fc17972698c3b86c92df3ff35cff255da8192e98ef8c1bbe4252eacdb66c3'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc2/dugite-native-v2.14.1-macOS-10.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '866aa1de21707d983427c9a8f4645169f966ab5d78f4d54de3b8b990cd83e35c'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc2/dugite-native-v2.14.1-win32-10.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '534168503fc96a8981cb7eca6628b854bff54694ad7fc68a29018cc9d7110754'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc2/dugite-native-v2.14.1-ubuntu-10.tar.gz'
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
