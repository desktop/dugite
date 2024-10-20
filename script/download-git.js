const ProgressBar = require('progress')
const tar = require('tar')
const { createHash } = require('crypto')
const { createReadStream, createWriteStream } = require('fs')

const { rm, mkdir, access } = require('fs/promises')

/**
 * Returns a value indicating whether or not the provided path exists (as in
 * whether it's visible to the current process or not).
 */
const pathExists = path =>
  access(path).then(
    () => true,
    () => false
  )

const { Readable } = require('stream')

const config = require('./config')()

const verifyFile = function (file, callback) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256')
      .on('error', reject)
      .on('finish', () => {
        const hash = h.digest('hex')
        if (hash !== config.checksum) {
          reject(
            new Error(
              `Validation failed. Expected '${config.checksum}' but got '${hash}'`
            )
          )
        } else {
          resolve()
        }
      })

    createReadStream(file).pipe(h).on('error', reject)
  })
}

const unpackFile = file =>
  tar.x({ cwd: config.outputPath, file }).catch(e => {
    console.log('Unable to extract archive, aborting...', e)
    process.exit(1)
  })

const downloadAndUnpack = async url => {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'dugite',
    },
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

  await new Promise((resolve, reject) => {
    Readable.fromWeb(res.body)
      .on('data', c => bar.tick(c.length))
      .pipe(createWriteStream(config.tempFile))
      .on('error', reject)
      .on('finish', resolve)
  })
  await verifyFile(config.tempFile)
  await unpackFile(config.tempFile)
}

;(async function run() {
  if (config.source === '') {
    console.log(
      `Skipping downloading embedded Git as platform '${process.platform}' is not supported.`
    )
    console.log(
      `To learn more about using dugite with a system Git: https://git.io/vF5oj`
    )
    process.exit(0)
  }

  await rm(config.outputPath, { recursive: true, force: true }).catch(error => {
    console.log(`Unable to clean directory at ${config.outputPath}`, error)
    process.exit(1)
  })

  await mkdir(config.outputPath, { recursive: true }).catch(error => {
    console.log(`Unable to create directory at ${config.outputPath}`, error)
    process.exit(1)
  })

  const tempFile = config.tempFile

  if (await pathExists(tempFile)) {
    await verifyFile(tempFile).catch(e => {
      console.log('Unable to verify cached archive, removing...', e)
      return rm(tempFile)
    })
    await unpackFile(tempFile)
  } else {
    await downloadAndUnpack(config.source)
  }
})()
