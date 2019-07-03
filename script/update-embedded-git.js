const got = require('got')
const fs = require('fs')
const path = require('path')

const url = `https://api.github.com/repos/desktop/dugite-native/releases/latest`

const options = {
  headers: {
    Accept: 'application/json',
    'User-Agent': 'dugite'
  },
  secureProtocol: 'TLSv1_2_method',
  json: true
}

got(url, options, async (err, response, release) => {
  if (err) {
    console.error('Unable to get latest release', err)
    return
  }

  const { tag_name, assets } = release

  console.log(`Updating embedded git config to use version ${tag_name}`)

  const output = {
    'win32-x64': await findWindows64BitRelease(assets),
    'win32-ia32': await findWindows32BitRelease(assets),
    'darwin-x64': await findMacOS64BitRelease(assets),
    'linux-x64': await findLinux64BitRelease(assets),
    'linux-arm64': await findLinuxARM64Release(assets)
  }

  const fileContents = JSON.stringify(output, null, 2)

  const embeddedGitPath = path.join(__dirname, 'embedded-git.json')

  fs.writeFileSync(embeddedGitPath, fileContents, 'utf8')

  console.log(`Done!`)
  console.log()
  console.log('Next you should prepare a new release:')
  console.log(`- commit any changes`)
  console.log(`- update the installed package with \`npm i\``)
  console.log(`- run the test suite with \`npm test\``)
})

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

function findMacOS64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-macOS.tar.gz'))
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

function findLinuxARM64Release(assets) {
  const asset = assets.find(a => a.name.endsWith('-arm64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux ARM64 archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function downloadChecksum(csUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'dugite-native'
      },
      secureProtocol: 'TLSv1_2_method'
    }

    got(csUrl, options, (err, response, body) => {
      if (err) {
        reject(err)
        return
      }

      resolve(body)
    })
  })
}

async function getDetailsForAsset(assets, currentAsset) {
  const { name } = currentAsset
  const url = currentAsset.browser_download_url
  const checksumFile = assets.find(a => a.name === `${name}.sha256`)
  const checksumRaw = await downloadChecksum(checksumFile.browser_download_url)
  const checksum = checksumRaw.trim()
  return { name, url, checksum }
}
