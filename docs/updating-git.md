# Updating Git

When a new version of Git is released, this package needs to update a couple of
pieces to consume this new version. Ideally we should update all supported
platforms to the same version, to ensure consumers of the package get the same
behaviour across different platforms.

The most important part is in [`lib/download-git.ts`](https://github.com/desktop/dugite/blob/master/lib/download-git.ts)
as this lists where to retrieve Git from, based on your platform.

The first thing to update is the root `config.version` entry:

```js
const config = {
  baseUrl: baseUrl,
  outputPath: path.join(__dirname, '..', 'git'),
  version: '2.10.0', // change this version to the latest public release of Git
  source: '',
  checksum: '',
  upstreamVersion: '',
  fileName: ''
}
```

After that, you should ensure the bits are hosted at the relevant location for
each supported platform:

```js
if (process.platform === 'darwin') {
  config.fileName = `Git-macOS-${config.version}-64-bit.zip`
  config.source = `https://www.dropbox.com/s/w2l51jsibl90jtd/${config.fileName}?dl=1`
  config.checksum = '5193a0923a7fc7cadc6d644d83bab184548987079f498cd77ee9df2a4509402e'
}
```

You will probably have to update these values as part of updating Git:

 - `config.fileName` - this will be the file name when downloaded to disk. Each packager will have their own quirks, so we're just following whatever convention has been defined upstream.
 - `config.source` - the location of the archive to download. This is retrieved during an `npm install` and unpacked to the `git` folder inside your package.
 - `config.checksum` - the SHA256 checksum of the file. If the packager hasn't documented this, you should download the file yourself and generate this to verify the contents haven't changed.

On macOS:

```sh
shasum -a 256 {path-to-file}
```

On Windows (PowerShell):

```
$(certutil -hashfile {path-to-file} SHA256)[1] -replace " ", ""
```

After that, you should test out the script for the platform you're currently running. This script will recompile the Typescript code and then download Git to your local machine.

```sh
npm run build
node ./build/download-git.js
```

If it was successful, the new version of Git will be located under `git` folder in this repository's root. As each platform is organized slightly differently on disk, you should verify it's unpacked successfully:

On macOS:

```sh
./git/bin/git --version
```

On Windows:

```sh
.\git\cmd\git.exe --version
```

If this outputs the correct version of Git, you're ready to ship this :metal:
