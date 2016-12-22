import { gitVersion, gitLfsVersion, buildNumber } from './versions'
import { Downloader } from './downloader'

export interface EnvironmentConfig {
  git: {
    version: string,
    fileName: string,
    source: string,
    checksum: string
  },
  lfs: {
    version: string,
    checksum: string,
    url: string,
    fileName: string
  },
  outputVersion: string
}

const LFSAliases: { [key: string]: string | null } = {
  'win32': 'Windows AMD64',
  'darwin': 'Mac AMD64',
  'linux': 'Linux AMD64'
}

export class Config {
  public static async getConfig(platform: string): Promise<EnvironmentConfig | null> {

    const outputVersion = `${gitVersion}-${buildNumber}`
    const lfsPlatform = LFSAliases[platform] || undefined

    if (lfsPlatform === undefined) {
      return Promise.reject(`unable to resolve LFS platform for ${platform}`)
    }

    const foundGitLFS = await Downloader.resolveGitLFSForPlatform(gitLfsVersion, lfsPlatform)

    if (platform === 'darwin') {
      const fileName = `git-${gitVersion}-macOS-3.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/53n7s0es7qonk85/${fileName}?dl=1`,
          checksum: '5e0f6402b076a8b1556ea8c87b6f3ba4a1ec42d3ea5613a04c7b6faf2e52e480',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '248cd9ed2f9bbd347bd398f73ce8ca73613bb48a3b0882440e0b40e83fb2d3fa',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    } else if (platform === 'win32') {
      const upstreamVersion = `v${gitVersion}.windows.1`
      const fileName = `MinGit-${gitVersion}-64-bit.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://github.com/git-for-windows/git/releases/download/${upstreamVersion}/${fileName}`,
          checksum: 'f31b0135e11e425555fb34779da3345ce8d32490fdd0a33b6f5ae8d74bae20b6',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '75266d8798f7bb16dc163a7fef7f6145f53a7f740f098e10c8a8bdef56b4fc78',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    } else {
      const fileName = `git-${gitVersion}-ubuntu-3.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/g61b4et0ebdiuoa/${fileName}?dl=1`,
          checksum: '3e554be024973043746cad76370081c1a1b4f42a93d454b5775a11012d86152e',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: 'cc21d28433a6eefef8287db6fb09e857b96a139ddcd3f228ff70a482e5dd226d',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    }
  }
}
