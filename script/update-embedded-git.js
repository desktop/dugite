const fs = require('fs')
const path = require('path')
const { get } = require('./utils')

get(`https://api.github.com/repos/desktop/dugite-native/releases/latest`).then(
  async response => {
    const { tag_name, assets } = JSON.parse(response)

    console.log(`Updating embedded git config to use version ${tag_name}`)

    const output = {
      'win32-x64': await findWindows64BitRelease(assets),
      'win32-ia32': await findWindows32BitRelease(assets),
      'darwin-x64': await findMacOSx64BitRelease(assets),
      'darwin-arm64': await findMacOSARM64BitRelease(assets),
      'linux-x64': await findLinux64BitRelease(assets),
      'linux-ia32': await findLinux32BitRelease(assets),
      'linux-arm': await findLinuxARM32BitRelease(assets),
      'linux-arm64': await findLinuxARM64BitRelease(assets),
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
  const asset = assets.find(a => a.name.endsWith('-ubuntu-x64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findLinux32BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-ubuntu-x86.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux 32-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findLinuxARM64BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-ubuntu-arm64.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux 64-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

function findLinuxARM32BitRelease(assets) {
  const asset = assets.find(a => a.name.endsWith('-ubuntu-arm.tar.gz'))
  if (asset == null) {
    throw new Error('Could not find Linux 32-bit archive in latest release')
  }
  return getDetailsForAsset(assets, asset)
}

async function getDetailsForAsset(assets, currentAsset) {
  const { name } = currentAsset
  const url = currentAsset.browser_download_url
  const checksumFile = assets.find(a => a.name === `${name}.sha256`)
  const checksumRaw = await fetch(checksumFile.browser_download_url, {
    headers: {
      'user-agent': 'dugite'
    }
  }).then(b => b.text())
  const checksum = checksumRaw.trim()
  return { name, url, checksum }
}
