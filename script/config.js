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
    config.checksum = 'c3401a498155a25f55a870f7a15f3e868d771096084068519e5d824fbc3bf4e8'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc3/dugite-native-v2.13.0-macOS-198.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'b93d95ebe70449efb606ff27091207ccf816fb82bf37c8ef0ac464d1bf598085'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc3/dugite-native-v2.13.0-win32-198.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '478b68b8f76297d9ab3b3f5384dbcb3be4fcfd89f2b8e15a9aba4c74f8be80b1'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc3/dugite-native-v2.13.0-ubuntu-198.tar.gz'
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
