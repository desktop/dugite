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
    config.checksum = '17d95150b6a370353f0ed97f205ab822ec739da54f6843e596493d099123a82f'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc5/dugite-native-v2.12.2-macOS-186.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = '9f231f6955d8208f21774d43d187e3ecf85267f9bd9a799594c3227d3e473de2'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc5/dugite-native-v2.12.2-win32-186.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '3258900c0019b48517ee4e9d0c5702474bb133da6ea0e5703f6b744679779efa'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.2-rc5/dugite-native-v2.12.2-ubuntu-186.tar.gz'
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
