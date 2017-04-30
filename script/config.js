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
    config.checksum = 'ecf249a78d622cc73fe1bcbc7376c9dc5d5ebe66f32e1a8a660559fc0ccbfeee'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc3/dugite-native-v2.12.2-macOS-181.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '279ea2a33de2c006fcdb68aecedad6b180ff215b7dbc0f74f4938b99d43cf089'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc3/dugite-native-v2.12.2-win32-181.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '5287d81eb563e3d5c7a459bae98dfd4f5a8b8ee903960032720baf421e67b9f8'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc3/dugite-native-v2.12.2-ubuntu-181.tar.gz'
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
