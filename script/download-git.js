const fs = require('fs')

const request = require('request')
const ProgressBar = require('progress')
const mkdirp = require('mkdirp')
const checksum = require('checksum')
const rimraf = require('rimraf')
const tar = require('tar')
const zlib = require('zlib')

const config = require('./config')()

function extract (source, callback) {
  const extractor = tar.Extract({path: config.outputPath})
    .on('error', function (error) { callback(error) })
    .on('end', function () { callback() })

  fs.createReadStream(source)
    .on('error', function (error) { callback(error) })
    .pipe(zlib.Gunzip())
    .pipe(extractor)
}


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
      console.log('Unable to extract archive, aborting...', error)
      process.exit(1)
    }
  })
}

const downloadAndUnpack = () => {
  console.log(`Downloading Git from: ${config.source}`)

  const options = {
    url: config.source,
    headers: {
      'Accept': 'application/octet-stream',
      'User-Agent': 'dugite',
    }
  }

  const req = request.get(options)

  req.pipe(fs.createWriteStream(config.tempFile))

  req.on('error', function (error) {
    console.log(`Error raised while downloading ${config.source}`, error)
    process.exit(1)
  })

  req.on('response', function (res) {
    if (res.statusCode !== 200) {
      console.log(`Non-200 response returned from ${config.source} - (${res.statusCode})`)
      process.exit(1)
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

      verifyFile(config.tempFile, valid => {
        if (valid) {
          unpackFile(config.tempFile)
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
    console.log(`Unable to create directory at ${config.outputPath}`, error)
    process.exit(1)
  }

  if (fs.existsSync(config.outputPath)) {
    try {
      rimraf.sync(config.outputPath)
    } catch (err) {
      console.error(err)
      return
    }
  }

  const tempFile = config.tempFile

  if (fs.existsSync(tempFile)) {
    verifyFile(tempFile, valid => {
      if (valid) {
        unpackFile(tempFile)
      } else {
        rimraf.sync(tempFile)
        downloadAndUnpack()
      }
    })
    return
  }

  downloadAndUnpack()
})
