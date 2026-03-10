# Releases

## Update Git

Run the [update-git.yml workflow](https://github.com/desktop/dugite/actions/workflows/update-git.yml) to update the embedded Git version.

This workflow will:

- retrieve the latest `dugite-native` release from the GitHub API
- get the checksums embedded in the release
- generate the `script/embedded-git.json` payload to be used at install time
- open a pull request with the dugite-native upgrade changes.

You must then approve and merge the pull request before continuing to the release process.

## Release/Publishing

Run the [publish.yml workflow](https://github.com/desktop/dugite/actions/workflows/publish.yml) to publish a new release. The workflow will take care of bumping the version number, publishing the package to NPM, and creating a GitHub release.

Releasing with version 'minor' is typically the way to go (it'll bump from x.y.z to x.(y+1).0), but you can also choose 'patch' (x.y.(z+1)) or 'major' ((x+1).0.0) if you need to.
