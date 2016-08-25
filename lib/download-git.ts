const decompress = require('decompress')
const request = require('request')
const temp = require('temp')
const ProgressBar = require('progress');

import * as mkdirp from 'mkdirp'
import * as path from 'path'

const baseUrl = process.env.NPM_CONFIG_ELECTRON_MIRROR ||
  process.env.npm_config_electron_mirror ||
  process.env.ELECTRON_MIRROR ||
  process.env.electron_mirror ||
  'https://github.com/electron/electron/releases/download/v'

const config = {
  baseUrl: baseUrl,
  outputPath: path.join(__dirname, 'git'),
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

function handleError (url: string, error: Error) {
  if (!error) {
    return
  }

  const message = error.message || error
  console.error(`Downloading ${url} failed: ${message}`)
  process.exit(1)
}

function unzip(file: Buffer, callback: any) {
  decompress(file, config.outputPath).then(() => {
    console.log('done!')
  })
}

mkdirp(config.outputPath, async function (error) {
  const fullUrl = config.source

  if (error) {
    return handleError(fullUrl, error)
  }

  console.log(`retrieving contents at url: ${fullUrl}`)

  const callback = function (error: Error, response: any, body: any) {

    console.log(`done?`)

    if (error) {
      return handleError(fullUrl, error)
    }

    if (response.statusCode !== 200) {
      return handleError(fullUrl, Error(`Non-200 response (${response.statusCode})`))
    }

    // TODO: store contents somewhere so we can replay

    temp.createWriteStream(config.fileName).write(body, function(error: Error) {
      // TODO: checksum bytes received
      console.log(`unzipping`)

      unzip(body, function (error: Error) {
        if (error) {
          return handleError(fullUrl, error)
        }
      })
    })
  }

  const req = request.get(fullUrl, { encoding: null }, callback)

  req.on('response', function(res: any) {
    const len = parseInt(res.headers['content-length'], 10);

    console.log();
    const bar = new ProgressBar('Downloading Git [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len
    });

    res.on('data', function(chunk: any) {
      bar.tick(chunk.length);
    })

    res.on('end', function () {
      console.log('\n');
    });
  })
})
