const { writeFile, appendFile, readFile } = require('fs/promises')
const { join } = require('path')

async function findDetailsForAsset(assets, suffix) {
  const asset = assets.find(a => a.name.endsWith(`-${suffix}.tar.gz`))

  if (!asset) {
    throw new Error(`Could not find ${suffix} archive in latest release`)
  }

  const { name, browser_download_url } = asset
  const checksumFile = assets.find(a => a.name === `${name}.sha256`)
  const checksumRaw = await fetch(checksumFile.browser_download_url, {
    headers: { 'user-agent': 'dugite' },
  }).then(b => b.text())

  const checksum = checksumRaw.trim()
  return { name, url: browser_download_url, checksum }
}

function findEmbeddedProductVersions(body) {
  const lines = body.split(/\r?\n/)
  const versions = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('## Versions')) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('## ')) {
          return versions
        }
        if (lines[j].startsWith('- ')) {
          const versionLine = lines[j]
          const [product, version] = versionLine
            .substring(2)
            .split(':')
            .map(s => s.trim())

          console.log(`${product} version: ${version}`)
          versions[product] = version
        }
      }
    }
  }

  return versions
}

const getTestHelperVariableFromProduct = product => {
  switch (product) {
    case 'Git':
      return 'gitVersion'
    case 'Git for Windows':
      return 'gitForWindowsVersion'
    case 'Git LFS':
      return 'gitLfsVersion'
    case 'Git Credential Manager':
      return 'gitCredentialManagerVersion'
  }

  throw new Error(`Unknown product: ${product}`)
}

fetch(`https://api.github.com/repos/desktop/dugite-native/releases/latest`)
  .then(r => r.text())
  .then(
    async response => {
      const { tag_name, assets, body } = JSON.parse(response)

      console.log(`Updating embedded git config to use version ${tag_name}`)

      const output = {
        'win32-x64': await findDetailsForAsset(assets, 'windows-x64'),
        'win32-ia32': await findDetailsForAsset(assets, 'windows-x86'),
        'win32-arm64': await findDetailsForAsset(assets, 'windows-arm64'),
        'darwin-x64': await findDetailsForAsset(assets, 'macOS-x64'),
        'darwin-arm64': await findDetailsForAsset(assets, 'macOS-arm64'),
        'linux-x64': await findDetailsForAsset(assets, 'ubuntu-x64'),
        'linux-ia32': await findDetailsForAsset(assets, 'ubuntu-x86'),
        'linux-arm': await findDetailsForAsset(assets, 'ubuntu-arm'),
        'linux-arm64': await findDetailsForAsset(assets, 'ubuntu-arm64'),
      }

      const fileContents = JSON.stringify(output, null, 2)

      const embeddedGitPath = join(__dirname, 'embedded-git.json')

      await writeFile(embeddedGitPath, fileContents, 'utf8')

      console.log('Updating test helpers with embedded product versions')
      const embeddedVersions = findEmbeddedProductVersions(body)
      const testHelpersPath = join(__dirname, '..', 'test', 'helpers.ts')
      let testHelpersContents = await readFile(testHelpersPath, 'utf8')

      for (const [product, version] of Object.entries(embeddedVersions)) {
        const variableName = getTestHelperVariableFromProduct(product)
        const regex = new RegExp(`export const ${variableName} = '[^']*'`, 'g')
        testHelpersContents = testHelpersContents.replaceAll(
          regex,
          `export const ${variableName} = '${version.startsWith('v') ? version.substring(1) : version}'`
        )

        if (process.env.GITHUB_OUTPUT) {
          await appendFile(
            process.env.GITHUB_OUTPUT,
            `${variableName}=${version}\n`,
            'utf8'
          )
        }
      }
      await writeFile(testHelpersPath, testHelpersContents, 'utf8')

      if (process.env.GITHUB_ACTIONS && process.env.GITHUB_OUTPUT) {
        await appendFile(
          process.env.GITHUB_OUTPUT,
          `dugite_version=${tag_name}\n`,
          'utf8'
        )
      }
    },
    err => {
      console.error('Unable to get latest release', err)
    }
  )
