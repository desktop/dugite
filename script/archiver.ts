import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as checksum from 'checksum'

const decompress = require('decompress')
const decompressUnzip = require('decompress-unzip')
const targz = require('tar.gz')
const tar = require('tar')
const zlib = require('zlib')

import { EnvironmentConfig } from './config'

export class Archiver {
  // leaving this option around as Git LFS has a whole bunch of variation
  // with how it's archived that we need to workaround here
  public static extractAndFlatten(source: string, destination: string, extension: string): Promise<void> {
    let options = {
        // strip any leading directory information
        strip: 1,
        // only extract a given set of file extensions
        filter: (file: { path: string } ) => path.extname(file.path) === extension
    }

    return decompress(source, destination, options)
  }

  // because Git packages may contain symlinks, we're gonna use some more
  // low-level libraries to ensure we preserve them when unpacking
  public static extractGzip(source: string, destination: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const extractor = tar.Extract({path: destination})
        .on('error', (error: Error) => reject(error))
        .on('end', () => resolve())

      fs.createReadStream(source)
        .on('error', (error: Error) => reject(error))
        .pipe(zlib.Gunzip())
        .pipe(extractor)
    })
  }

  // TODO: once all upstream releases are done with `tgz` this code will not be necessary
  public static extractZip(source: string, destination: string): Promise<void> {
    let options = {
      plugins: [
        decompressUnzip()
      ]
    }
    return decompress(source, destination, options)
  }

  public static unpackGitLFS(platform: string, source: string, destination: string): Promise<void> {
    if (platform === 'win32') {
      const nestedPath = path.join(destination, 'mingw64', 'libexec', 'git-core')
      return Archiver.extractAndFlatten(source, nestedPath, '.exe')
    } else if (platform === 'darwin' || platform === 'linux') {
      const nestedPath = path.join(destination, 'libexec', 'git-core')
      return Archiver.extractAndFlatten(source, nestedPath, '')
    } else {
      return Promise.reject(`unable to unpack Git LFS as platform '${platform}' is not currently supported`)
    }
  }

  public static unpackGit(source: string, directory: string): Promise<void> {
    if (fs.existsSync(directory)) {
      rimraf.sync(directory)
    }

    if (path.extname(source) === '.zip') {
      return Archiver.extractZip(source, directory)
    } else {
      return Archiver.extractGzip(source, directory)
    }
  }

  public static async unpackAll(platform: string, config: EnvironmentConfig, temporaryDirectory: string): Promise<void> {
    const temporaryGitDownload = path.join(temporaryDirectory, config.git.fileName)
    const temporaryGitDirectory = path.join(temporaryDirectory, platform, config.git.version)

    const temporaryGitLFSDownload =  path.join(temporaryDirectory, config.lfs.fileName)

    await Archiver.unpackGit(temporaryGitDownload, temporaryGitDirectory)
    await Archiver.unpackGitLFS(platform, temporaryGitLFSDownload, temporaryGitDirectory)
  }

  public static create(directory: string, file: string): Promise<void> {
    const read = targz().createReadStream(directory);
    const write = fs.createWriteStream(file);
    read.pipe(write);
    return Promise.resolve()
  }

  public static output(file: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      checksum.file(file, { algorithm: 'sha256' }, (err: Error, hash: string) => {

        if (err) {
          reject(err)
        }

        console.log(`File: ${file}`)
        console.log(`SHA256: ${hash}`)
        resolve()
      })
    })
  }
}
