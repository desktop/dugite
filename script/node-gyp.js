const { exec } = require('child_process')

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const task = exec(command)

    task.stdout.on('data', data => {
      console.log(`stdout: ${data}`)
    })

    task.stderr.on('data', data => {
      console.error(`stderr: ${data}`)
    })

    task.on('close', code => {
      console.log(`${command} exited with code ${code}`)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} exited with code ${code}`))
      }
    })
  })
}

function installNodeGyp() {
  return runCommand('npm i -g node-gyp@9.3.1')
}

function configureNodeGyp() {
  return runCommand('node-gyp configure')
}

function buildNodeGyp() {
  return runCommand('node-gyp build')
}

if (process.platform === 'win32') {
  installNodeGyp()
    .then(() => configureNodeGyp())
    .then(() => buildNodeGyp())
    .catch(err => console.error(err))
}
