import { spawn } from 'child_process'
import { glob } from 'glob'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

if (['-h', '--help'].includes(process.argv[2])) {
  console.log(`Usage: ${process.argv0} [kind]`)
  console.log('  kind: The kind of tests to run (e.g. "fast", "slow", "external", "all")')
  process.exit(0)
}

(async function(kind) {

  const wildcard = kind && kind !== 'all' ? `${kind}/**` : '**'
  const files = await glob(`test/${wildcard}/*-test.ts`)

  spawn('node', ['--loader', 'tsx', '--test', ...files], {
    stdio: 'inherit',
    env: {
      ...process.env,
      LOCAL_GIT_DIRECTORY: resolve(dirname(fileURLToPath(import.meta.url)), '../git/')
    }
  })

})(process.argv[2])
