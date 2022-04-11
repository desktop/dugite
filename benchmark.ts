import { GitProcess } from './lib'
import * as d3 from 'd3-array'
import { table } from 'table'

interface ITimingResult {
  readonly warmup: number,
  readonly avg: number,
  readonly max: number,
  readonly min: number,
  readonly mean: number,
  readonly median: number,
  readonly total: number,
}

const NS_PER_SEC = 1e9

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'assert failure')
  }
}

async function version() {
  const result = await GitProcess.exec(['version'], 'c:\\git-sdk-64\\usr\\src\\git')
  assert(result.stdout.indexOf('2.13') !== -1)
}

async function gitAuthor() {
  const result = await GitProcess.exec(['var', 'GIT_AUTHOR_IDENT'], 'c:\\git-sdk-64\\usr\\src\\git')
  assert(result.stdout.length > 0)
}

async function gitStatus() {
  const result = await GitProcess.exec(['status'], 'c:\\git-sdk-64\\usr\\src\\git')
  assert(result.stdout.length > 0)
}

function now(): number {
  const hrTime = process.hrtime()
  return hrTime[0] * NS_PER_SEC + hrTime[1]
}

async function timeOnce(func: () => Promise<void>): Promise<number> {
  const start = now()
  await func()
  return (now() - start) / 1000000
}

async function sleep(delay: number) {
  if (delay === 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    setTimeout(resolve, delay)
  })
}

async function time(func: () => Promise<void>, times: number, delay: number = 0): Promise<ITimingResult> {

  const warmup = await timeOnce(func)
  const results = new Array<number>()

  for (let i = 0; i < times; i++) {
    results.push(await timeOnce(func))
    if (delay) {
      await sleep(delay)
    }
  }

  return <ITimingResult>{
    warmup,
    min: d3.min(results),
    max: d3.max(results),
    mean: d3.mean(results),
    median: d3.median(results),
    avg: d3.sum(results) / results.length,
    total: d3.sum(results),
  }
}

function enableRunCommand() {
  process.env['GIT_USE_READ_COMMAND'] = "1"
}

function disableRunCommand() {
  delete process.env['GIT_USE_READ_COMMAND']
}

async function runScenario(func: () => Promise<void>, times: number, delay: number): Promise<{ x: ITimingResult, y: ITimingResult }> {
  disableRunCommand()
  const x = await time(func, times, delay)
  enableRunCommand()
  const y = await time(func, times, delay)

  return { x, y }
}

// function formatTiming(x: number, y: number) {
//   const t = (x - y).toFixed(0) + 'ms'
//   const d = ((y / x) * 100).toFixed(0) + '%'
//   return `${t} (${d})`
// }

async function run() {
  const results = []
  let result: { x: ITimingResult, y: ITimingResult }

  results.push([
    '',
    'normal', 'run-command',
    // 'total normal', 'total run-command',
    'delta avg',
  ])

  result = await runScenario(version, 50, 0)
  results.push([
    'git version',
    result.x.avg.toFixed(0) + "ms",
    result.y.avg.toFixed(0) + "ms",
    // result.x.total.toFixed(0) + "ms",
    // result.y.total.toFixed(0) + "ms",
    (result.y.avg - result.x.avg).toFixed(0) + "ms (" + (((result.x.avg / result.y.avg) - 1) * 100).toFixed(0) + "%)"
  ])

  result = await runScenario(version, 50, 50)
  results.push([
    'git version with delay',
    result.x.avg.toFixed(0) + "ms",
    result.y.avg.toFixed(0) + "ms",
    // result.x.total.toFixed(0) + "ms",
    // result.y.total.toFixed(0) + "ms",
    (result.y.avg - result.x.avg).toFixed(0) + "ms (" + (((result.x.avg / result.y.avg) - 1) * 100).toFixed(0) + "%)"
  ])

  result = await runScenario(gitAuthor, 50, 0)
  results.push([
   'git var',
    result.x.avg.toFixed(0) + "ms",
    result.y.avg.toFixed(0) + "ms",
    // result.x.total.toFixed(0) + "ms",
    // result.y.total.toFixed(0) + "ms",
    (result.y.avg - result.x.avg).toFixed(0) + "ms (" + (((result.x.avg / result.y.avg) - 1) * 100).toFixed(0) + "%)"
  ])


  result = await runScenario(gitAuthor, 50, 50)
  results.push([
   'git var with delay',
    result.x.avg.toFixed(0) + "ms",
    result.y.avg.toFixed(0) + "ms",
    // result.x.total.toFixed(0) + "ms",
    // result.y.total.toFixed(0) + "ms",
    (result.y.avg - result.x.avg).toFixed(0) + "ms (" + (((result.x.avg / result.y.avg) - 1) * 100).toFixed(0) + "%)"
  ])

  result = await runScenario(gitStatus, 10, 0)
  results.push([
   'git status',
    result.x.avg.toFixed(0) + "ms",
    result.y.avg.toFixed(0) + "ms",
    // result.x.total.toFixed(0) + "ms",
    // result.y.total.toFixed(0) + "ms",
    (result.y.avg - result.x.avg).toFixed(0) + "ms (" + (((result.x.avg / result.y.avg) - 1) * 100).toFixed(0) + "%)"
  ])

  console.log(table(results))
}

process.env['LOCAL_GIT_DIRECTORY'] = "c:\\git-sdk-64"
run()
