# Environment Variables

There are some ways you can change the behaviour of `dugite` by providing
environment variables. These are grouped into two categories - when you
install `dugite` into a package, and when you spawn Git using `GitProcess`.

## Installation

If `DUGITE_CACHE_DIR` is specified, this directory is used when installing the
package to cache the platform-specific upstream packages containing the Git
distributable. This is ideal for scenarios like build servers, where assets
should be cached to speed up testing.

If this is not specified, it will fallback to [`os.tmpdir()`](https://nodejs.org/dist/latest-v8.x/docs/api/os.html#os_os_tmpdir)
which is provided by Node.

If you are connected to the internet using a proxy, make sure that
`GLOBAL_AGENT_HTTP_PROXY` or `GLOBAL_AGENT_HTTPS_PROXY` is configured correctly.
Otherwise the installation will fail with a connection error. You can also use
`HTTP_PROXY` or `HTTPS_PROXY` as aliases for these environment variables.
For more information see: [Controlling proxy behaviour using environment variables](https://github.com/gajus/global-agent#environment-variables)

## Execution

If you have a separate Git distribution you would prefer to use with `dugite`,
you can enable this by setting these two environment variables.

 - `LOCAL_GIT_DIRECTORY` - this represents the root location of Git (i.e. the
    directory containing `bin/git`)
 - `GIT_EXEC_PATH` - this represents where Git's subprograms are located (Git
    can be compiled to use a given path, and some distributors will move these
    programs to a different location)

To simplify this setup, you can use the `find-git-exec` module.

Here's some example code:

```ts
import { dirname } from 'path'
import { default as findGit, Git } from 'find-git-exec'

let git: Git | undefined = undefined

try {
  git = await findGit()
} catch {}

if (git.path && git.execPath) {
  const { path, execPath } = git
  // Set the environment variable to be able to use an external Git.
  process.env.GIT_EXEC_PATH = execPath
  process.env.LOCAL_GIT_DIRECTORY = dirname(dirname(path))
}
```
