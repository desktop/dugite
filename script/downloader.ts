import * as request from 'request'
import * as ProgressBar from 'progress'
import * as fs from 'fs'
import * as path from 'path'
import * as checksum from 'checksum'
import * as rimraf from 'rimraf'

import { EnvironmentConfig } from './config'

export interface GitLFSLookup {
  url: string,
  fileName: string
}

export interface Asset {
  browser_download_url: string,
  name: string,
  label: string,
}

const verifyFile = (file: string, expected: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    checksum.file(file, { algorithm: 'sha256' }, (_: any, hash: string) => {
      if (hash !== expected) {
        console.log(`checksum failed: got '${hash}' but expected '${expected}'`)
      }
      resolve(hash === expected)
    })
  })
}

export class Downloader {
  private static getReleaseAssets(owner: string, repo: string, tag: string): Promise<ReadonlyArray<Asset>> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`

    // TODO: look for environment variable for a GitHub token
    const options = {
      url: url,
      headers: {
        'User-Agent': 'git-kitchen-sink'
      }
    };

    if (process.env.GITHUB_API_TOKEN) {
      const headers = options.headers as any
      headers['Authorization'] = `Token ${process.env.GITHUB_API_TOKEN}`
    }

    return new Promise<ReadonlyArray<Asset>>((resolve, reject) => {
      request.get(options, (error, response, body) => {

        if (error) {
          reject(error)
        }

        if (response.statusCode === 403) {
          reject('Oops, it seems you\'ve been rate-limited on this IP address. Set GITHUB_API_TOKEN to an empty personal acceess token from https://github.com/settings/tokens to workaround this')
        }

        if (response.statusCode !== 200) {
          reject('unexpected response code: ' + response.statusCode)
        }

        const json = JSON.parse(body)
        resolve(json.assets)
      })
    })
  }

  public static async resolveGitLFSForPlatform(version: string, platform: string): Promise<GitLFSLookup> {

    const assets = await Downloader.getReleaseAssets('github', 'git-lfs', `v${version}`)

    const label = platform
    const asset = assets.find(a => a.label === label)
    if (!asset) {
      return Promise.reject(`unable to find asset on Git-LFS release: ${label}`)
    }

    return Promise.resolve({ url: asset.browser_download_url, fileName: asset.name })
  }

  private static download(alias: string, url: string, destination: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`Downloading ${url}`)

      const options = {
        url: url,
        headers: {
          'User-Agent': 'git-kitchen-sink'
        },
        encoding: null
      };

      const req = request.get(options, (error, response, body) => {

        // console.log(`Writing contents to ${url} to ${destination}`)

        const callback = (error?: Error) => {
          // TODO: i'm not sure if this is even valid
          if (error) {
            reject(error)
          }

          if (response.statusCode !== 200) {
            reject(`unexpected response code: ${response.statusCode}`)
          }

          resolve()
        }

        fs.createWriteStream(destination).write(body, callback)
      })

      req.on('response', function (res) {
        const len = parseInt(res.headers['content-length'], 10)

        console.log()
        const bar = new ProgressBar('Downloading ' + alias + ' [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 50,
          total: len
        })

        res.on('data', (chunk: string | Buffer) => {
          bar.tick(chunk.length)
        })

        res.on('end', function () {
          console.log('\n')
        })
      })
    })
  }

  public static async downloadGit(config: EnvironmentConfig, temporaryDirectory: string): Promise<void> {

    const destination = path.join(temporaryDirectory, config.git.fileName)

    if (fs.existsSync(destination)) {
      const valid = await verifyFile(destination, config.git.checksum)
        if (valid) {
         return Promise.resolve()
      } else {
        console.log('cached Git found but doesn\'t match checksum, trying again...')
        rimraf.sync(destination)
        return Downloader.download('Git', config.git.source, destination)
      }
    } else {
      await Downloader.download('Git', config.git.source, destination)
      const isValid = await verifyFile(destination, config.git.checksum)
      if (!isValid) {
        rimraf.sync(destination)
        return Promise.reject('downloaded Git doesn\'t match checksum, aborting...')
      }
    }
  }

  public static async downloadGitLFS(config: EnvironmentConfig, temporaryDirectory: string): Promise<void> {

    const url = config.lfs.url
    const destination = path.join(temporaryDirectory, config.lfs.fileName)

    if (fs.existsSync(destination)) {
      const valid = await verifyFile(destination, config.lfs.checksum)
      if (valid) {
         return Promise.resolve()
      } else {
        console.log('cached Git LFS found but doesn\'t match checksum, trying again...')
        rimraf.sync(destination)
        return Downloader.download('Git LFS', url, destination)
      }
    } else {
      await Downloader.download('Git LFS', url, destination)
      const valid = await verifyFile(destination, config.lfs.checksum)

      if (valid) {
        return Promise.resolve()
      } else {
        rimraf.sync(destination)
        return Promise.reject('downloaded Git LFS doesn\'t match checksum, aborting...')
      }
    }
  }
}
