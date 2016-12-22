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
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}

config.fileName = `git-kitchen-sink-${process.platform}-v${config.version}-2.tgz`

// TODO: swap these out for official release URLs when we make the repository public

if (process.platform === 'darwin') {
  config.source = `https://www.dropbox.com/s/pd1q8gqttvhgm59/${config.fileName}?dl=1`
  config.checksum = '0416eefdf160b7f176b1cdd5f5bb36a07968240769b76645f7959a3b91906f98'
} else if (process.platform === 'win32') {
  config.source = `https://www.dropbox.com/s/wjbs9p8959nt8w4/${config.fileName}?dl=1`
  config.checksum = '8723719b1dfb461715b39f88f048dfc1444b617fa1673dde0c17bdf6e70605ae'
} else if (process.platform === 'linux') {
  // switching this to Ubuntu to ensure it's clear what we're installing here
  config.fileName = `git-kitchen-sink-ubuntu-v${config.version}-2.tgz`
  config.source = `https://www.dropbox.com/s/cm69onplkfixwfy/${config.fileName}?dl=1`
  config.checksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
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
