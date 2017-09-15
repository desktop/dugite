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
    config.checksum = 'f1d50dce0293011065ffabbffbf9986647bc01d1c81d8bfe4e34e2745fed38f1'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc3/dugite-native-v2.14.1-macOS-13.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '5eca6e3beb0c1d2ffa439101fb0d8ecce7069b6861a2c4cb75c581bd4c265a90'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc3/dugite-native-v2.14.1-win32-13.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '585bd548b05034c4c93a3ee8e39de9389781981d30853bad0574fa858297f3cd'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc3/dugite-native-v2.14.1-ubuntu-13.tar.gz'
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
