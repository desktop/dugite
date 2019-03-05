# Releases

## Update Git

The most important part of the release process is updating the embedded Git package. This can be done using this one-liner:

```sh
yarn update-embedded-git
```

This script:

- retrieves the latest `dugite-native` release from the GitHub API
- gets the checksums embedded in the release
- generates the `script/embedded-git.json` payload to be used at install time

## Publishing to NPM

Releases are done to NPM, and are currently limited to the core team.

```sh
# to ensure everything is up-to-date and tests pass
yarn
# you might need to do a different sort of version bump here
yarn version
# this will also run the test suite and fail if any errors found
yarn publish
# ensure the version bump is published too
git push origin master
# as well as the new tag
git push origin --tags
```
