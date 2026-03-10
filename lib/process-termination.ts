import { ChildProcess } from 'child_process'

let ctrlc: { sigintWindows: (pid: number) => boolean } | undefined

// Only load the native addon on Windows and when it's available
if (process.platform === 'win32') {
  try {
    // @ts-ignore - Dynamic import of native module
    ctrlc = require('./ctrlc.node')
  } catch (error) {
    // Native addon not available, fall back to regular termination
    console.warn(
      'dugite: Native Ctrl+C addon not available, using fallback termination method'
    )
  }
}

/**
 * Kill method to use Ctrl+C on Windows when available.
 * This is a monkey-patche approach for the ChildProcess.kill method to keep the API consistent.
 */
export function processTerminator(childProcess: ChildProcess): void {
  if (process.platform !== 'win32' || !ctrlc) {
    return
  }

  const originalKill = childProcess.kill.bind(childProcess)

  childProcess.kill = function (signal?: NodeJS.Signals | number): boolean {
    const pid = childProcess.pid

    // Only try Ctrl+C for explicit SIGTERM/SIGINT signals on Windows
    if (pid && (signal === 'SIGTERM' || signal === 'SIGINT')) {
      try {
        if (ctrlc!.sigintWindows(pid)) {
          return true
        }
      } catch (_) {
        // Fall through to original kill
      }
    }

    // Use original kill method being used as fallback here
    return originalKill(signal)
  }
}
