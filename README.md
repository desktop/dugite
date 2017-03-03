# dugite
## Elegant Node bindings for Git

This is a skunkworks project to make using Git in your Electron application.

To get started: `npm install dugite --save`

And then reference it in your application:

```js
import { GitProcess, GitError, IGitResult } from 'dugite'

const pathToRepository = 'C:/path/to/git/repository/'

const result = await GitProcess.exec([ 'status' ], pathToRepository)
if (result.exitCode === 0) {
  const version = result.stdout
  // TODO: do some things with version
} else {
  const error = result.stderr
  // TODO: error handling
}
```

Current features:

 - package Git within your application
 - make it easy to execute Git commands
 - macOS and Window support

Potential Roadmap:

 - an API for common Git operations
 - Linux support
 - handle authentication and environment setup
 - ???


### Contributing

After cloning down this repository, run:

```sh
npm install
```

And then you can create the package yourself:

```sh
npm pack
```
