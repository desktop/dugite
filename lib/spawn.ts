import { ignoreClosedInputStream } from './ignore-closed-input-stream'
import { setupEnvironment } from './git-environment'
import { processTerminator } from './process-termination'
import { spawn as _spawn } from 'child_process'

/**
 * A set of configuration options that can be passed when
 * executing a streaming Git command.
 */
export interface IGitSpawnOptions {
  /**
   * An optional collection of key-value pairs which will be
   * set as environment variables before executing the git
   * process.
   */
  readonly env?: Record<string, string | undefined>
}

/**
 * Execute a command and interact with the process outputs directly.
 *
 * The returned promise will reject when the git executable fails to launch,
 * in which case the thrown Error will have a string `code` property. See
 * `errors.ts` for some of the known error codes.
 */
export function spawn(args: string[], path: string, opts?: IGitSpawnOptions) {
  const { env, gitLocation } = setupEnvironment(opts?.env ?? {})
  const spawnedProcess = _spawn(gitLocation, args, { env, cwd: path })

  ignoreClosedInputStream(spawnedProcess)

  processTerminator(spawnedProcess)

  return spawnedProcess
}
