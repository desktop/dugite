import { ChildProcess } from 'child_process'

/**
 * Prevent errors originating from the stdin stream related
 * to the child process closing the pipe from bubbling up and
 * causing an unhandled exception when no error handler is
 * attached to the input stream.
 *
 * The common scenario where this happens is if the consumer
 * is writing data to the stdin stream of a child process and
 * the child process for one reason or another decides to either
 * terminate or simply close its standard input. Imagine this
 * scenario
 *
 *  cat /dev/zero | head -c 1
 *
 * The 'head' command would close its standard input (by terminating)
 * the moment it has read one byte. In the case of Git this could
 * happen if you for example pass badly formed input to apply-patch.
 *
 * Since consumers of dugite using the `exec` api are unable to get
 * a hold of the stream until after we've written data to it they're
 * unable to fix it themselves so we'll just go ahead and ignore the
 * error for them. By supressing the stream error we can pick up on
 * the real error when the process exits when we parse the exit code
 * and the standard error.
 *
 * See https://github.com/desktop/desktop/pull/4027#issuecomment-366213276
 */
export function ignoreClosedInputStream({ stdin }: ChildProcess) {
  // If Node fails to spawn due to a runtime error (EACCESS, EAGAIN, etc)
  // it will not setup the stdio streams, see
  // https://github.com/nodejs/node/blob/v10.16.0/lib/internal/child_process.js#L342-L354
  // The error itself will be emitted asynchronously but we're still in
  // the synchronous path so if we attempts to call `.on` on `.stdin`
  // (which is undefined) that error would be thrown before the underlying
  // error.
  if (!stdin) {
    return
  }

  stdin.on('error', err => {
    const code =
      'code' in err && typeof err.code === 'string' ? err.code : undefined

    // Is the error one that we'd expect from the input stream being
    // closed, i.e. EPIPE on macOS and EOF on Windows. We've also
    // seen ECONNRESET failures on Linux hosts so let's throw that in
    // there for good measure.
    if (code === 'EPIPE' || code === 'EOF' || code === 'ECONNRESET') {
      return
    }

    // Nope, this is something else. Are there any other error listeners
    // attached than us? If not we'll have to mimic the behavior of
    // EventEmitter.
    //
    // See https://nodejs.org/api/errors.html#errors_error_propagation_and_interception
    //
    // "For all EventEmitter objects, if an 'error' event handler is not
    //  provided, the error will be thrown"
    if (stdin.listeners('error').length <= 1) {
      throw err
    }
  })
}
