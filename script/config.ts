import { gitVersion, gitLfsVersion } from './versions'
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

    const outputVersion = `${gitVersion}-1`
    const lfsPlatform = LFSAliases[platform] || undefined

    if (lfsPlatform === undefined) {
      return Promise.reject(`unable to resolve LFS platform for ${platform}`)
    }

    const foundGitLFS = await Downloader.resolveGitLFSForPlatform(gitLfsVersion, lfsPlatform)


    if (platform === 'darwin') {
      const fileName = `Git-macOS-${gitVersion}-64-bit.zip`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/w2l51jsibl90jtd/${fileName}?dl=1`,
          checksum: '5193a0923a7fc7cadc6d644d83bab184548987079f498cd77ee9df2a4509402e',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '66801312c377b77e31f39d28c61d74cd4731ad26a2cc6cf50dccf0acf0691d7c',
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
          checksum: 'a7268f4ab447e62940347d52fe01321403cfa3e9e94b8e5cac4d6ded28962d64',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: 'cebbcd8f138834e0ba42f468dc8707845217524fb98fe16c7c06aa0afc984115',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    } else {
      const fileName = `git-${gitVersion}-ubuntu.tar.gz`
      return {
        git: {
          version: gitVersion,
          fileName: fileName,
          // NOTE: update these details if the place hosting the Git bits has changed
          source: `https://www.dropbox.com/s/te0grj36xm9dkic/${fileName}?dl=1`,
          checksum: '1e67dbd01de8d719a56d082c3ed42e52f2c38dc8ac8f65259b8660e028f85a30',
        },
        lfs: {
          version: gitLfsVersion,
          checksum: '2c1de8d00759587a93eb78b24c42192a76909d817214d4abc312135c345fbaca',
          url: foundGitLFS.url,
          fileName: foundGitLFS.fileName
        },
        outputVersion
      }
    }
  }
}
