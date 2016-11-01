const decompress = require('decompress')
const request = require('request')
const ProgressBar = require('progress')
const tmpdir = require('os-tmpdir')
const mkdirp = require('mkdirp')
const path = require('path')
const fs = require('fs')
const checksum = require('checksum')
const rimraf = require('rimraf')

const config = {
  outputPath: path.join(__dirname, '..', 'git'),
  version: '2.10.0',
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}

if (process.platform === 'darwin') {
  config.fileName = `Git-macOS-${config.version}-64-bit.zip`
  // TODO: swap this out for something more official, lol
  config.source = `https://www.dropbox.com/s/w2l51jsibl90jtd/${config.fileName}?dl=1`
  config.checksum = '5193a0923a7fc7cadc6d644d83bab184548987079f498cd77ee9df2a4509402e'
} else if (process.platform === 'win32') {
  config.upstreamVersion = `v${config.version}.windows.1`
  config.fileName = `MinGit-${config.version}-64-bit.zip`
  config.source = `https://github.com/git-for-windows/git/releases/download/${config.upstreamVersion}/${config.fileName}`
  config.checksum = '2e1101ec57da526728704c04792293613f3c5aa18e65f13a4129d00b54de2087'
} else if (process.platform === 'linux') {
  // TODO: these versions are out of sync, whatever
  config.fileName = `git-2.10.1-ubuntu.tgz`
  config.source = `https://www.dropbox.com/s/te0grj36xm9dkic/${config.fileName}?dl=0`
  config.checksum = '1e67dbd01de8d719a56d082c3ed42e52f2c38dc8ac8f65259b8660e028f85a30'
}
const fullUrl = config.source

function handleError (url, error) {
  if (!error) {
    return
  }

  const message = error.message || error
  console.error(`Downloading ${url} failed: ${message}`)
  process.exit(1)
}

function unzip (path, callback) {
  const result = decompress(path, config.outputPath)

  result
    .then(() => {
      callback(null)
    })
    .catch(err => {
      callback(err)
    })
}

const dir = tmpdir()
const temporaryFile = path.join(dir, config.fileName)

const verifyFile = function (file, callback) {
  // console.log(`verifying checksum...`)

  checksum.file(file, { algorithm: 'sha256' }, (_, hash) => {
    callback(hash === config.checksum)
  })
}

const unpackFile = function (file) {
  unzip(file, function (error) {
    if (error) {
      return handleError(fullUrl, error)
    }
  })
}

const downloadCallback = function (error, response, body) {
  if (error) {
    return handleError(fullUrl, error)
  }

  if (response.statusCode !== 200) {
    return handleError(fullUrl, Error(`Non-200 response (${response.statusCode})`))
  }

  fs.createWriteStream(temporaryFile).write(body, function (error) {
    if (error) {
      return handleError(fullUrl, error)
    }

    verifyFile(temporaryFile, valid => {
      if (valid) {
        // console.log('file valid. unpacking...')
        unpackFile(temporaryFile)
      } else {
        // console.log('file not valid. aborting...')
        process.exit(1)
      }
    })
  })
}

const downloadAndUnpack = () => {
  console.log(`Downloading Git from: ${fullUrl}`)

  const req = request.get(fullUrl, { encoding: null }, downloadCallback)

  req.on('response', function (res) {
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
    })
  })
}

mkdirp(config.outputPath, function (error) {
  if (error) {
    return handleError(fullUrl, error)
  }

  if (fs.existsSync(config.outputPath)) {
    // console.log(`directory exists at ${config.outputPath}, removing...`)
    try {
      rimraf.sync(config.outputPath)
    } catch (err) {
      console.error(err)
      return
    }
  }

  if (fs.existsSync(temporaryFile)) {
    // console.log(`cached file exists at ${temporaryFile}, verifying...`)
    verifyFile(temporaryFile, valid => {
      if (valid) {
        unpackFile(temporaryFile)
      } else {
        // console.log('cached file not valid. removing...')
        rimraf.sync(temporaryFile)
        downloadAndUnpack()
      }
    })
    return
  }

  // console.log(`file does not exist. downloading...`)

  downloadAndUnpack()
})
