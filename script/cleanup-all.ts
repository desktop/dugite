import * as fs from 'fs'
import * as mkdirp from 'mkdirp'
import * as rimraf from 'rimraf'

export function cleanupAll(directory: string): Promise<void> {
  if (!fs.existsSync(directory)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    mkdirp(directory, (error: Error) => {
      if (error) {
        reject(error)
      }

      if (fs.existsSync(directory)) {
        try {
          rimraf.sync(directory)
        } catch (error) {
          reject(error)
        }
      }

      resolve()
    })
  })
}
