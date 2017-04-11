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
    config.checksum = '462813ac9a71f8e71104392678cd408c4f5177bbb4d6d7b9ea6400671c095ef9'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc2/dugite-native-v2.12.2-macOS-163.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '106e269ab06525ec1b55467fc0fd063af916b63a3d7fbeec650020b16f15b113'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc2/dugite-native-v2.12.2-win32-163.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'fa453d72f3b3f4de8e395a547c6c120fc705c6febfa661bfcfc0910b3bc839b7'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc2/dugite-native-v2.12.2-ubuntu-163.tar.gz'
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
