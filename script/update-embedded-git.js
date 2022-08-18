const fs = require('fs')
const path = require('path')
const https = require('https')

const get = url => {
  const options = {
    headers: { 'User-Agent': 'dugite' },
    secureProtocol: 'TLSv1_2_method'
  }

  return new Promise((resolve, reject) => {
    https.get(url, options).on('response', res => {
      if ([301, 302].includes(res.statusCode)) {
        get(res.headers.location).then(resolve, reject)
      } else if (res.statusCode !== 200) {
        reject(new Error(`Got ${res.statusCode} from ${url}`))
      } else {
        const chunks = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'))
        })
      }
    })
  })
}

get(`https://api.github.com/repos/desktop/dugite-native/releases/latest`).then(
  async response => {
    const { tag_name, assets } = JSON.parse(response)

    console.log(`Updating embedded git config to use version ${tag_name}`)

    const output = {
      'win32-x64': await findWindows64BitRelease(assets),
      'win32-ia32': await findWindows32BitRelease(assets),
      'darwin-x64': await findMacOSx64BitRelease(assets),
      'darwin-arm64': await findMacOSARM64BitRelease(assets),
      'linux-x64': await findLinux64BitRelease(assets)
    }

    const fileContents = JSON.stringify(output, null, 2)

    const embeddedGitPath = path.join(__dirname, 'embedded-git.json')

    fs.writeFileSync(embeddedGitPath, fileContents, 'utf8')

    console.log(`Done!`)
    console.log()
    console.log('Next you should prepare a new release:')
    console.log(`- commit any changes`)
    console.log(`- update the installed package with \`yarn\``)
    console.log(`- run the test suite with \`yarn test\``)
  },
  err => {
    console.error('Unable to get latest release', err)
  }
)

function findWindows64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-windows-x64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Windows 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findWindows32BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-windows-x86.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Windows 32-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findMacOSx64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-macOS-x64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find MacOS 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findMacOSARM64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-macOS-arm64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find MacOS 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findLinux64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-ubuntu.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

async function getDetailsForAsset(assets, currentAsset) {
  const { name } = currentAsset
  const url = currentAsset.browser_download_url
  const checksumFile = assets.find(a => a.name === `${name}.sha256`)
  const checksumRaw = await get(checksumFile.browser_download_url)
  const checksum = checksumRaw.trim()
  return { name, url, checksum }
}
