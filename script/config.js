const URL = require('url')
const path = require('path')
const os = require('os')
const fs = require('fs')

const embeddedGit = require('./embedded-git.json')

function getConfig() {
  const config = {
    outputPath: path.join(__dirname, '..', 'git'),
    source: '',
    checksum: '',
    fileName: '',
    tempFile: ''
  }

  let arch = os.arch();

  if (process.env.npm_config_arch) {
    // If a specific npm_config_arch is set, we use that one instead of the OS arch (to support cross compilation)
    console.log('npm_config_arch detected: ' + process.env.npm_config_arch);
    arch = process.env.npm_config_arch;
  }

  if (process.platform === 'win32' && arch === 'arm64') {
    // Use the Dugite Native ia32 package for Windows arm64 (arm64 can run 32-bit code through emulation)
    console.log('Downloading 32-bit Dugite Native for Windows arm64');
    arch = 'ia32';
  }

  // Os.arch() calls it x32, we use x86 in actions, dugite-native calls it x86 and our embedded-git.json calls it ia32
  if (arch === 'x32' || arch === 'x86') {
    arch = 'ia32'
  }

  const key = `${process.platform}-${arch}`

  const entry = embeddedGit[key]

  if (entry != null) {
    config.checksum = entry.checksum
    config.source = entry.url
  } else {
    console.log(`No embedded Git found for ${process.platform} and architecture ${arch}`)
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
