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

  if (process.platform === "darwin") {
    config.checksum = '9c59f4c77e5b3ac5ebd2dbdf7872e55264d4763561aeb03a30e2356c92d4f64f'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.3-rc10/dugite-native-v2.13.3-macOS-3.tar.gz'
  } else if (process.platform === "win32") {
    config.checksum = '091261bec442a3e26211b62cf651ce6b67bb63547cb1c3ccbf7d0a2bdaa8e629'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.3-rc10/dugite-native-v2.13.3-win32-3.tar.gz'
  } else if (process.platform === "linux") {
    config.checksum = 'fdd712fa145523dd2254564c9aae50f8ddc3988b285358ca146f28f5705b5eb8'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.3-rc10/dugite-native-v2.13.3-ubuntu-3.tar.gz'
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
