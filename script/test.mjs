import { spawn } from 'child_process'
import { glob } from 'glob'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

if (process.argv.some(arg => ['-h', '--help'].includes(arg))) {
  console.log(`Usage: ${process.argv0} [kind]`)
  console.log('  kind: The kind of tests to run (e.g. "fast", "slow", "external", "all")')
  process.exit(0)
}

(async function(kind) {

  const wildcard = kind && kind !== 'all' ? `${kind}/**` : '**'
  const files = await glob(`test/${wildcard}/*-test.ts`)

  spawn('node', ['--import', 'tsx', '--test', ...files], {
    stdio: 'inherit',
    env: {
      ...process.env,
      LOCAL_GIT_DIRECTORY: resolve(dirname(fileURLToPath(import.meta.url)), '../git/')
    }
  }).on('exit', process.exit)

})(process.argv[2])
