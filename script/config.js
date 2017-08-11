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
    config.checksum = '93c21455d41eb7d8ac0c3dd3113dab1748a7d4b228c70e06db98a5a75df247e1'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc1/dugite-native-v2.14.1-macOS-7.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'dd5d02570b537821dc2698bad3a44f79de4366be4f0ff2e80f35c681a670af89'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc1/dugite-native-v2.14.1-win32-7.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = '13b41ccefebbf909e07e1929c126bc24d17847d99c53d6ccff9267ad7c810ac1'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.14.1-rc1/dugite-native-v2.14.1-ubuntu-7.tar.gz'
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
