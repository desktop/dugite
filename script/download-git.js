const decompress = require('decompress')
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
  version: '2.11.0',
  build: '6',
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}

function formatPlatform(platform) {
  // switching this to Ubuntu to ensure it's clear what we're installing here
  if (platform === 'linux') {
    return 'ubuntu'
  }
  return platform
}

config.fileName = `git-kitchen-sink-${formatPlatform(process.platform)}-v${config.version}-${config.build}.tgz`

// TODO: swap these out for official release URLs when we make the repository public

if (process.platform === 'darwin') {
  config.source = `https://www.dropbox.com/s/qcj0qdnorjlm3rz/${config.fileName}?dl=1`
  config.checksum = 'd1998417ba8d85c5c9b8fff9b75f2c9f50c9c5729892f73e0dca550df056de69'
} else if (process.platform === 'win32') {
  config.source = `https://www.dropbox.com/s/56cep29cssjvekx/${config.fileName}?dl=1`
  config.checksum = '445846a029e824c2bc3a1c8cdee4f4d4c014248530ece3464351f4355bb6e266'
} else if (process.platform === 'linux') {
  // switching this to Ubuntu to ensure it's clear what we're installing here
  config.fileName = `git-kitchen-sink-ubuntu-v${config.version}-${config.build}.tgz`
  config.source = `https://www.dropbox.com/s/mr9bawuzof7360s/${config.fileName}?dl=1`
  config.checksum = '01fbe5496ac7ded5cc3487ffd82d30b3a1f94f101ff2a3cc86f12c0f988bbdb6'
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

function extract (source, callback) {
  if (path.extname(source) === '.zip') {
    const result = decompress(source, config.outputPath)
    result
      .then(() => {
        callback(null)
      })
      .catch(err => {
        callback(err)
      })

  } else {
    const extractor = tar.Extract({path: config.outputPath})
      .on('error', function (error) { callback(error) })
      .on('end', function () { callback() })

    fs.createReadStream(source)
      .on('error', function (error) { callback(error) })
      .pipe(zlib.Gunzip())
      .pipe(extractor)
  }
}

const dir = tmpdir()
const temporaryFile = path.join(dir, config.fileName)

const verifyFile = function (file, callback) {
  checksum.file(file, { algorithm: 'sha256' }, (_, hash) => {
    const isValid = hash === config.checksum
    if (!isValid) {
      console.log(`DEBUG: expected checksums to be equal: ${hash} === ${config.checksum}`)
    }
    callback(hash === config.checksum)
  })
}

const unpackFile = function (file) {
  extract(file, function (error) {
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
        unpackFile(temporaryFile)
      } else {
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
