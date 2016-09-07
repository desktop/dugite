# git-kitchen-sink
## Incorporate Git into your Electron application

This is a skunkworks project to make using Git in your Electron application.

To get started: `npm install git-kitchen-sink --save`

And then reference it in your application:

```js
import { GitProcess, GitError, GitErrorCode } from 'git-kitchen-sink'

const pathToRepository = 'C:/path/to/git/repository/'

GitProcess.execWithOutput([ '--version' ], pathToRepository)
  .then(output => {
    // TODO: read version
  })
  .catch(error => {
    // TODO: better error handling
  })
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

After cloning down this repository, install the dependencies:

```sh
npm install
```

Unfortunately this will fail due to the current `postinstall` script executing
when it doesn't need to. This requires a compiled JavaScript file that doesn't
exist in version control.

Running this will get you back to a happy place:

```sh
npm run build
```

And then you can create the package yourself:

```sh
npm pack
```
