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
      const fileName = `git-${gitVersion}-macOS-8.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/ldnteh38mxdohyc/${fileName}?dl=1`,
          checksum: '505d0e4f38d58bf30d7a2ada82ca548eff076c62635b5abc2ccf76524ae922bd',
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
      const upstreamVersion = `v${gitVersion}.windows.3`
      const fileName = `MinGit-${gitVersion}.3-64-bit.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://github.com/git-for-windows/git/releases/download/${upstreamVersion}/${fileName}`,
          checksum: 'bf3714e04bcbafb464353235a27c328c43d40568d6b2e9064f1a63444b8236c5',
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
      const fileName = `git-${gitVersion}-ubuntu-8.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/ubqqdyszu41dcan/${fileName}?dl=1`,
          checksum: 'c7e36973a6fe1d71011b874da7584a5e3602c960c22d0d553aa26f5eac39993b',
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
