const URL = require('url')
const path = require('path')
const os = require('os')
const fs = require('fs')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  if (process.platform === 'darwin') {
    config.checksum = 'e95eefd33c8305aa4b362fe76d4a499cd7c1f11ff3183fc10009317466bc309f'
    config.source =
      'https://github.com/desktop/dugite-native/releases/download/v2.18.0-4/dugite-native-v2.18.0-macOS.tar.gz'
  } else if (process.platform === 'win32') {
    if (os.arch() === 'x64') {
      config.checksum = '186cba377cbb7f2bb0d0061ccdd9ddc12c7acc8381a2f56e3c59952a1ecc09a9'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-4/dugite-native-v2.18.0-windows-x64.tar.gz'
    } else {
      config.checksum = '680769787069722f283bf0e5f0acaed37c049bbe81a27ebda6fa4b9b8ffe86d1'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-4/dugite-native-v2.18.0-windows-x86.tar.gz'
    }
  } else if (process.platform === 'linux') {
    if (os.arch() === 'arm64') {
      config.checksum = '5182bc8660ec3052d9ae05ee209f95a567eed30d7c6c60920c25ca68ce6f032b'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-4/dugite-native-v2.18.0-arm64.tar.gz'
    } else {
      config.checksum = '8eb1468bd10927229c7adbc41e0dec2b0f1fdbd0605fda9194cca028b35d52b1'
      config.source =
        'https://github.com/desktop/dugite-native/releases/download/v2.18.0-4/dugite-native-v2.18.0-ubuntu.tar.gz'
    }
  }

  if (config.source !== '') {
    // compute the filename from the download source
    const url = URL.parse(config.source)
    const pathName = url.pathname
    const index = pathName.lastIndexOf('/')
    config.fileName = pathName.substr(index + 1)

    const cacheDirEnv = process.env.DUGITE_CACHE_DIR

    const cacheDir = cacheDirEnv ? path.resolve(cacheDirEnv) : os.tmpdir()

    try {
      fs.statSync(cacheDir)
    } catch (e) {
      fs.mkdirSync(cacheDir)
    }

    config.tempFile = path.join(cacheDir, config.fileName)
  }

  return config
}

module.exports = getConfig
