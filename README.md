# Dugite - JS bindings for Git

This project provides bindings for Node applications to interact with Git repositories, using the same command line interface that core Git offers.

The source is in TypeScript, but can be consumed by any JavaScript  application.

### Getting Started

Add it to your project:

```
> npm install dugite --save
```

Then reference it in your application:

```js
import { GitProcess, GitError, IGitResult } from 'dugite'

const pathToRepository = 'C:/path/to/git/repository/'

const result = await GitProcess.exec([ 'status' ], pathToRepository)
if (result.exitCode === 0) {
  const output = result.stdout
  // do some things with the output
} else {
  const error = result.stderr
  // error handling
}
```

### Features

 - make it easy to work with Git repositories
 - use the same commands as you would in a shell
 - access to the full set of commands, options and formatting that Git core uses
 - access to the latest features of Git

### Supported Platforms

 - Windows 7 and later
 - macOS 10.9 and up
 - Linux (tested on Ubuntu Precise/Trusty and Fedora 24)

### Status

This project is under active development for Git-related projects at GitHub. This will stabilize as this library gets more usage in production, and is open to external contributions that align with the project's goals.

If you are interested in getting involved with this project, refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) file for instructions and the [documentation](./docs/) sections for more information about the project.

### Roadmap

As this is under active development, the roadmap is also subject to change. Some ideas:

 - authentication support in-the-box
 - make environment setup easier to override
 - API additions for common tasks such as parsing output
 - error handling improvements
