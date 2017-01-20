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
      const fileName = `Git-${gitVersion}-macOS-9.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/gwymygflez6rmd4/${fileName}?dl=1`,
          checksum: 'c5f319b615ad8ecebfb6484039a8e130e12eca9e0de848df6567625b0bf48d56',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '2227668c76a07931dd387602f67c99d5d42f0a99c73b76f8949bbfe3a4cc49c7',
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
          checksum: '7c23635f34b0b4eed55621231148ef3e0de9a46e2d629b4bba7f706a96ae77ea',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    } else {
      const fileName = `git-${gitVersion}-ubuntu-9.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/l825m3ehtqlo734/${fileName}?dl=1`,
          checksum: '9443ad180dfc34b5bf2592e2d6b9af7b6b3a679fe7559edc575d80898e02f38f',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '910b2b5c158b238256087cae9b84cbc0bfb83c061d5b41161b79ca08cf61b2e8',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    }
  }
}
