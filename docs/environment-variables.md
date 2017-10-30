# Environment Variables

There are some ways you can change the behaviour of `dugite` by providing
environment variables. These are grouped into two categories - when you
install `dugite` into a package, and when you spawn Git using `GitProcess`.

## Install Time

If `DUGITE_CACHE_DIR` is specified, this directory is used when installing the
package to cache the platform-specific upstream packages containing the Git
distributable. This is ideal for scenarios like build servers, where assets
should be cached to speed up testing.

If this is not specified, it will fallback to [`os.tmpdir()`](https://nodejs.org/dist/latest-v8.x/docs/api/os.html#os_os_tmpdir)
which is provided by Node.

## Runtime

TODO: `LOCAL_GIT_DIRECTORY`

TODO: `GIT_EXEC_PATH`
