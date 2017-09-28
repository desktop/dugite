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
    config.checksum = '8c2440b8990500b2ed4cc37f779cf17165052bd0ec2ca77be4161173fe56ac23'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc1/dugite-native-v2.14.2-macOS-16.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'fb6228381a08b0acd037b8fdcdb367c6dc6257f1e62015fe5178c62e648783fe'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc1/dugite-native-v2.14.2-win32-16.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '9d7ff67091485c35382ecf294d01a2cfada0d98390f1b530753fa64c2c51df75'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.2-rc1/dugite-native-v2.14.2-ubuntu-16.tar.gz'
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
