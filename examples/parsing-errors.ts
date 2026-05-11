import { exec as git, GitError, parseError } from '../lib/'

async function getError() {
  const branch = 'master'
  const path = 'C:/path/to/repo/'

  const result = await git(['pull', 'origin', branch], path)
  if (result.exitCode !== 0) {
    const error = parseError(result.stderr)
    if (error) {
      if (error === GitError.HTTPSAuthenticationFailed) {
        // invalid credentials
      }
      // TODO: other scenarios
    }
  }
}
