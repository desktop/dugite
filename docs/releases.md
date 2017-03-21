# Releases

Releases are done to NPM, and are currently limited to the core team.

```sh
# to ensure everything is up-to-date
npm i
# you might need to do a different sort of version bump here
npm version minor
# this will also run the test suite and fail if any errors found
npm publish
# ensure the version bump is published too
git push origin master
# as well as the new tag
git push origin --tags
```
