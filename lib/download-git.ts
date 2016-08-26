const decompress = require('decompress')
const request = require('request')
const ProgressBar = require('progress');
const tmpdir = require('os-tmpdir')

import * as mkdirp from 'mkdirp'
import * as path from 'path'
import * as fs from 'fs'
import * as checksum from 'checksum'

const baseUrl = process.env.NPM_CONFIG_ELECTRON_MIRROR ||
  process.env.npm_config_electron_mirror ||
  process.env.ELECTRON_MIRROR ||
  process.env.electron_mirror ||
  'https://github.com/electron/electron/releases/download/v'

const config = {
  baseUrl: baseUrl,
  outputPath: path.join(__dirname, '..', 'git'),
  version: '2.9.3',
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}

if (process.platform === 'darwin') {
  // TODO: put things in here
  config.upstreamVersion = ''
  config.fileName = ''
  config.source = ''
  config.checksum = ''
} else if (process.platform === 'win32') {
  config.upstreamVersion = `v${config.version}.windows.1`
  config.fileName = `MinGit-${config.version}-64-bit.zip`
  config.source = `https://github.com/git-for-windows/git/releases/download/${config.upstreamVersion}/${config.fileName}`
  config.checksum = '17e40cb149ce6a348c8e8bbe7f1c1fff00f82882f0e57f32d60ea5c26feeef98'
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

function unzip(path: string, callback: any) {
  console.log(`unzipping to ${config.outputPath}`)
  decompress(path, config.outputPath).then(() => {
    console.log('done!')
  })
}

const dir = tmpdir()
const temporaryFile = path.join(dir, config.fileName)

const verifyFile = function(file: string, callback: (valid: boolean) => void) {
  checksum.file(file, { algorithm: 'sha256' }, (error: Error, hash: string) => {
    callback(hash === config.checksum)
  })
}

const unpackFile = function (file: string) {
  console.log(`unzipping...`)

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
  console.log(`Download Git from: ${fullUrl}`)

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

  console.log(`checking for file ${temporaryFile}...`)

  if (fs.existsSync(temporaryFile)) {
    console.log('file exists. verifying...')
    verifyFile(temporaryFile, valid => {
      if (valid) {
        console.log('file valid. unpacking...')
        unpackFile(temporaryFile)
      } else {
        console.log('file not valid. try again...')
        // downloadAndUnpack()
      }
    })
    return
  }

  console.log(`file does not exist. downloading...`)

  downloadAndUnpack()
})
