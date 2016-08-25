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
 - make it easy to execute commands
 - macOS and Window support

Potential Roadmap:

 - an API for common Git operations
 - Linux support
 - handle authentication and environment setup
 - ???
