const decompress = require('decompress')
const request = require('request')
const ProgressBar = require('progress');
const tmpdir = require('os-tmpdir')

import * as mkdirp from 'mkdirp'
import * as path from 'path'
import * as fs from 'fs'
import * as checksum from 'checksum'
import * as rimraf from 'rimraf'

const baseUrl = process.env.NPM_CONFIG_ELECTRON_MIRROR ||
  process.env.npm_config_electron_mirror ||
  process.env.ELECTRON_MIRROR ||
  process.env.electron_mirror ||
  'https://github.com/electron/electron/releases/download/v'

const config = {
  baseUrl: baseUrl,
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
}

const fullUrl = config.source

function handleError (url: string, error: Error) {
  if (!error) {
    return
  }

  const message = error.message || error
  console.error(`Downloading ${url} failed: ${message}`)
  process.exit(1)
}

function unzip(path: string, callback: (err: Error | null) => void) {
  const result: Promise<void> = decompress(path, config.outputPath)

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

const verifyFile = function(file: string, callback: (valid: boolean) => void) {
  console.log(`verifying checksum...`)

  checksum.file(file, { algorithm: 'sha256' }, (error: Error, hash: string) => {
    callback(hash === config.checksum)
  })
}

const unpackFile = function (file: string) {
  unzip(file, function (error: Error) {
    if (error) {
      return handleError(fullUrl, error)
    }
  })
}

const downloadCallback = function (error: Error, response: any, body: any) {
  if (error) {
    return handleError(fullUrl, error)
  }

  if (response.statusCode !== 200) {
    return handleError(fullUrl, Error(`Non-200 response (${response.statusCode})`))
  }

  fs.createWriteStream(temporaryFile).write(body, function(error: Error) {
    if (error) {
      return handleError(fullUrl, error)
    }

    verifyFile(temporaryFile, valid => {
      if (valid) {
        console.log('file valid. unpacking...')
        unpackFile(temporaryFile)
      } else {
        console.log('file not valid. aborting...')
        process.exit(1)
      }
    })
  })
}

const downloadAndUnpack = () => {
  console.log(`Downloading Git from: ${fullUrl}`)

  const req = request.get(fullUrl, { encoding: null }, downloadCallback)

  req.on('response', function(res: any) {
    const len = parseInt(res.headers['content-length'], 10);

    console.log();
    const bar = new ProgressBar('Downloading Git [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 50,
      total: len
    });

    res.on('data', function(chunk: any) {
      bar.tick(chunk.length);
    })

    res.on('end', function () {
      console.log('\n');
    });
  })
}

mkdirp(config.outputPath, async function (error) {
  if (error) {
    return handleError(fullUrl, error)
  }

  if (fs.existsSync(config.outputPath)) {
    console.log(`directory exists at ${config.outputPath}, removing...`)
    try {
      rimraf.sync(config.outputPath)
    } catch (err) {
      console.error(err)
      return
    }
  }

  if (fs.existsSync(temporaryFile)) {
    console.log(`cached file exists at ${temporaryFile}, verifying...`)
    verifyFile(temporaryFile, valid => {
      if (valid) {
        unpackFile(temporaryFile)
      } else {
        console.log('cached file not valid. removing...')
        rimraf.sync(temporaryFile)
        downloadAndUnpack()
      }
    })
    return
  }

  console.log(`file does not exist. downloading...`)

  downloadAndUnpack()
})
