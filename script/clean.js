const { rm } = require('fs/promises')
const { join } = require('path')

rm(join(__dirname, '..', 'build'), { recursive: true, force: true }).catch(
  console.error
)
