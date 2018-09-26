const request = require('request')
const fs = require('fs')
const path = require('path')

const options = {
  url: `https://api.github.com/repos/desktop/dugite-native/releases/latest`,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'dugite'
  },
  secureProtocol: 'TLSv1_2_method',
  json: true
}

request(options, async (err, response, release) => {
  if (err) {
    console.error('Unable to get latest release', err)
    return
  }

  const { tag_name, assets } = release

  console.log(`Updating embedded git config to use version ${tag_name}`)

  const output = {}

  const windows64bit = assets.find(a => a.name.endsWith('-windows-x64.tar.gz'))
  if (windows64bit == null) {
    throw new Error('Could not find Windows 64-bit archive in latest release')
  }
  output['win32-x64'] = await getDetailsForAsset(assets, windows64bit)

  const windows32bit = assets.find(a => a.name.endsWith('-windows-x86.tar.gz'))
  if (windows32bit == null) {
    throw new Error('Could not find Windows 32-bit archive in latest release')
  }
  output['win32-x86'] = await getDetailsForAsset(assets, windows32bit)

  const macOS = assets.find(a => a.name.endsWith('-macOS.tar.gz'))
  if (macOS == null) {
    throw new Error('Could not find macOS archive on latest release')
  }
  output['darwin-x64'] = await getDetailsForAsset(assets, macOS)

  const linux64bit = assets.find(a => a.name.endsWith('-ubuntu.tar.gz'))
  if (linux64bit == null) {
    throw new Error('Could not find Linux archive on latest release')
  }
  output['linux-x64'] = await getDetailsForAsset(assets, linux64bit)

  const linuxARM = assets.find(a => a.name.endsWith('-arm64.tar.gz'))
  if (linuxARM == null) {
    throw new Error('Could not find ARM64 archive on latest release')
  }
  output['linux-arm64'] = await getDetailsForAsset(assets, linuxARM)

  const fileContents = JSON.stringify(output, null, 2)

  const embeddedGitPath = path.join(__dirname, 'embedded-git.json')

  fs.writeFileSync(embeddedGitPath, fileContents, 'utf8')
})

function downloadChecksum(url) {
  return new Promise((resolve, reject) => {
    const options = {
      url,
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'dugite-native'
      },
      secureProtocol: 'TLSv1_2_method'
    }

    request(options, (err, response, body) => {
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
