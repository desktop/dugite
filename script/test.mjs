import { spawn } from 'child_process'
import { join } from 'path'
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

process.env.LOCAL_GIT_DIRECTORY = 'git'
const args = ['--import', 'tsx', ...testReporterArgs, '--test', ...files]

spawn('node', args, { stdio: 'inherit' }).on('exit', process.exit)
