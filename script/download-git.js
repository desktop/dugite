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
  build: '7',
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
  config.source = `https://www.dropbox.com/s/uie0f4iopug2zfb/${config.fileName}?dl=1`
  config.checksum = 'f63307e1b0ed3a6a4a607b30f801cc6ba99d6ee6dc25a0056e79e102c521a6eb'
} else if (process.platform === 'win32') {
  config.source = `https://www.dropbox.com/s/yf33r47e3zby8mo/${config.fileName}?dl=1`
  config.checksum = '0aab55d5fbd9185052bd3f10292562d24650d44ce3e0b462cc8f1a53b5e70867'
} else if (process.platform === 'linux') {
  config.source = `https://www.dropbox.com/s/0ncude55tc2d8i5/${config.fileName}?dl=1`
  config.checksum = '49dd340c7fe813aeb039122a400e852caf0e393aca5cb61dba2c6b36c3d44b8b'
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
        console.log(`checksum verification failed, refusing to unpack...`)
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
