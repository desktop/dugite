const ProgressBar = require('progress')
const tar = require('tar')
const https = require('https')
const { createHash } = require('crypto')
const {
  rm,
  rmSync,
  mkdir,
  createReadStream,
  createWriteStream,
  existsSync,
} = require('fs')
const { Readable } = require('stream')

const config = require('./config')()

const verifyFile = function (file, callback) {
  const h = createHash('sha256').on('finish', () => {
    const hash = h.digest('hex')
    const match = hash === config.checksum
    if (!match) {
      console.log(
        `Validation failed. Expected '${config.checksum}' but got '${hash}'`
      )
    }
    callback(match)
  })

  createReadStream(file).pipe(h)
}

const unpackFile = function (file) {
  tar.x({ cwd: config.outputPath, file }).catch(e => {
    console.log('Unable to extract archive, aborting...', error)
    process.exit(1)
  })
}

const downloadAndUnpack = async url => {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'dugite',
    },
    secureProtocol: 'TLSv1_2_method',
  }).catch(e => {
    console.log('Unable to download archive, aborting...', e)
    process.exit(1)
  })

  if (!res.ok) {
    console.log(`Got ${res.status} trying to download archive, aborting...`)
    process.exit(1)
  }

  const len = parseInt(res.headers.get('content-length'), 10)

  const bar = new ProgressBar('Downloading Git [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 50,
    total: len,
  })

  Readable.fromWeb(res.body)
    .on('data', c => bar.tick(c.length))
    .pipe(createWriteStream(config.tempFile))
    .on('end', () => {
      verifyFile(config.tempFile, valid => {
        if (valid) {
          unpackFile(config.tempFile)
        } else {
          console.log(`checksum verification failed, refusing to unpack...`)
          process.exit(1)
        }
      })
    })

  // res.on('data', c => bar.tick(c.length))
}

if (config.source === '') {
  console.log(
    `Skipping downloading embedded Git as platform '${process.platform}' is not supported.`
  )
  console.log(
    `To learn more about using dugite with a system Git: https://git.io/vF5oj`
  )
  process.exit(0)
}

rm(config.outputPath, { recursive: true, force: true }, error => {
  if (error) {
    console.log(`Unable to clean directory at ${config.outputPath}`, error)
    process.exit(1)
  }

  mkdir(config.outputPath, { recursive: true }, function (error) {
    if (error) {
      console.log(`Unable to create directory at ${config.outputPath}`, error)
      process.exit(1)
    }

    const tempFile = config.tempFile

    if (existsSync(tempFile)) {
      verifyFile(tempFile, valid => {
        if (valid) {
          unpackFile(tempFile)
        } else {
          rmSync(tempFile)
          downloadAndUnpack(config.source)
        }
      })
      return
    }

    downloadAndUnpack(config.source)
  })
})
