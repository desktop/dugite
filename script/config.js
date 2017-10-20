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
    config.checksum = 'd9f5afe8c0c18c9d595e57e1e96958a337a0ee72d547d3cbf0e698d69b524a1e'
    config.source = process.env.DUGITE_NATIVE_DARWIN_DOWNLOAD || 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc3/dugite-native-v2.14.2-macOS-20.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'bfe092195459ba9a1e88c8d0b6812373cdc01877ae7f9b2c05c8e463398f372c'
    config.source = process.env.DUGITE_NATIVE_WIN32_DOWNLOAD || 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc3/dugite-native-v2.14.2-win32-20.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'aa8a9107b310b65cb26143e82fdbc1c48a4cc9efc63aeb64b33710ec3ceefb67'
    config.source = process.env.DUGITE_NATIVE_LINUX_DOWNLOAD || 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc3/dugite-native-v2.14.2-ubuntu-20.tar.gz'
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
