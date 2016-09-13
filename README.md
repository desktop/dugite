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

After cloning down this repository, bootstrap your environment:

```sh
# on Windows
.\script\bootstrap.bat
# on macOS
./script/bootstrap
```

And then you can create the package yourself:

```sh
npm pack
```
