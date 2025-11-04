const { writeFile, appendFile } = require('fs/promises')
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

fetch(`https://api.github.com/repos/desktop/dugite-native/releases/latest`)
  .then(r => r.text())
  .then(
    async response => {
      const { tag_name, assets } = JSON.parse(response)

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

      console.log(`Done!`)
      console.log()
      console.log('Next you should prepare a new release:')
      console.log(`- commit any changes`)
      console.log(`- update the installed package with \`yarn\``)
      console.log(`- run the test suite with \`yarn test\``)

      if (process.env.GITHUB_ACTIONS) {
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
