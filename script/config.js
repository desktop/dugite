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
    config.checksum = 'a77aea05eaf4e6adaa7bf54d6286aea39cd8c5075eb26da7ba3ae44657471bfa'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc4/dugite-native-v2.13.0-macOS-201.tar.gz'
  } else if (process.platform === 'win32') {
    config.checksum = 'eddc419a04add7f001a29f5fa4736ada69eb536208b7e911394c090cab0643ca'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc4/dugite-native-v2.13.0-win32-201.tar.gz'
  } else if (process.platform === 'linux') {
    config.checksum = 'f271c2eb8fd2da8ee46612bf0fb436af937a427d412ad7b2607ea75c2f37e1de'
    config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.13.0-rc4/dugite-native-v2.13.0-ubuntu-201.tar.gz'
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
