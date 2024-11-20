import { spawn } from 'child_process'
import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { readdir } from 'fs/promises'

const files = await readdir('test', { recursive: true }).then(x =>
  x.filter(f => f.endsWith('-test.ts')).map(f => join('test', f))
)

const reporterDestinationArgs = ['--test-reporter-destination', 'stdout']
const specTestReporterArgs = [
  '--test-reporter',
  'spec',
  ...reporterDestinationArgs,
]

const testReporterArgs = process.env.GITHUB_ACTIONS
  ? [
      '--test-reporter',
      'node-test-github-reporter',
      ...reporterDestinationArgs,
      ...specTestReporterArgs,
    ]
  : specTestReporterArgs

const scriptsDir = dirname(fileURLToPath(import.meta.url))
process.env.LOCAL_GIT_DIRECTORY = resolve(scriptsDir, '../git/')
const args = ['--import', 'tsx', ...testReporterArgs, '--test', ...files]

spawn('node', args, { stdio: 'inherit' }).on('exit', process.exit)
