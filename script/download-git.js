const URL = require('url')
const request = require('request')
const ProgressBar = require('progress')
const tmpdir = require('os-tmpdir')
const mkdirp = require('mkdirp')
const path = require('path')
const fs = require('fs')
const checksum = require('checksum')
const rimraf = require('rimraf')

const tar = require('tar')
const zlib = require('zlib')

const config = {
  outputPath: path.join(__dirname, '..', 'git'),
  version: '2.12.1',
  build: '145',
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}

if (process.platform === 'darwin') {
  config.checksum = '75a0d7d9bf743bc2dc2e2dfa815be39c14b5e6c7d480a10934f1f2b74cc3875e'
  config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-macOS-145.tar.gz'
} else if (process.platform === 'win32') {
  config.checksum = '6d82f4361ecb78fb1556a8c2f54711c1b76b301007a2000393cea34d363d2dcf'
  config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-win32-145.tar.gz'
} else if (process.platform === 'linux') {
  config.checksum = 'dfed95bb0bb905627cfccca7d9462a551129ea70ff20525cb85b88011d0fd513'
  config.source = 'https://github.com/desktop/dugite-native/releases/download/v2.12.1-rc1/dugite-native-v2.12.1-ubuntu-145.tar.gz'
}

const url = URL.parse(config.source)
const pathName = url.pathname
const index = pathName.lastIndexOf('/')
config.fileName = pathName.substr(index + 1)

const fullUrl = config.source

function handleError (url, error) {
  if (!error) {
    return
  }

  const message = error.message || error
  console.error(`Downloading ${url} failed: ${message}`)
  process.exit(1)
}

function extract (source, callback) {
  const extractor = tar.Extract({path: config.outputPath})
    .on('error', function (error) { callback(error) })
    .on('end', function () { callback() })

  fs.createReadStream(source)
    .on('error', function (error) { callback(error) })
    .pipe(zlib.Gunzip())
    .pipe(extractor)
}

const dir = tmpdir()
const temporaryFile = path.join(dir, config.fileName)

const verifyFile = function (file, callback) {
  checksum.file(file, { algorithm: 'sha256' }, (_, hash) => {

    const match = hash === config.checksum

    if (!match) {
      console.log(`Validation failed. Expected '${config.checksum}' but got '${hash}'`)
    }

    callback(match)
  })
}

const unpackFile = function (file) {
  extract(file, function (error) {
    if (error) {
      return handleError(fullUrl, error)
    }
  })
}

const downloadAndUnpack = () => {
  console.log(`Downloading Git from: ${fullUrl}`)

  const options = {
    url: fullUrl,
    headers: {
      'Accept': 'application/octet-stream',
      'User-Agent': 'dugite',
    }
  }

  const req = request.get(options)

  req.pipe(fs.createWriteStream(temporaryFile))

  req.on('error', e => {
    handleError(fullUrl, e)
  })

  req.on('response', function (res) {

    if (res.statusCode !== 200) {
      handleError(fullUrl, Error(`Non-200 response (${res.statusCode})`))
      return
    }

    const len = parseInt(res.headers['content-length'], 10)

    console.log()
    const bar = new ProgressBar('Downloading Git [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 50,
      total: len
    })

    res.on('data', function (chunk) {
      bar.tick(chunk.length)
    })

    res.on('end', function () {
      console.log('\n')

      verifyFile(temporaryFile, valid => {
        if (valid) {
          unpackFile(temporaryFile)
        } else {
          console.log(`checksum verification failed, refusing to unpack...`)
          process.exit(1)
        }
      })
    })
  })
}

mkdirp(config.outputPath, function (error) {
  if (error) {
    return handleError(fullUrl, error)
  }

  if (fs.existsSync(config.outputPath)) {
    try {
      rimraf.sync(config.outputPath)
    } catch (err) {
      console.error(err)
      return
    }
  }

  if (fs.existsSync(temporaryFile)) {
    verifyFile(temporaryFile, valid => {
      if (valid) {
        unpackFile(temporaryFile)
      } else {
        rimraf.sync(temporaryFile)
        downloadAndUnpack()
      }
    })
    return
  }

  downloadAndUnpack()
})
