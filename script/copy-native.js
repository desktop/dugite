const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..') // <root>

try {
  // Copy to <root>/lib/ctrlc.node
  fs.copyFileSync(
    path.join(rootDir, 'build', 'Release', 'ctrlc.node'),
    path.join(rootDir, 'lib', 'ctrlc.node')
  )

  fs.mkdirSync(path.join(rootDir, 'build', 'lib'), { recursive: true })

  // Copy to <root>/build/lib/ctrlc.node
  // attention if we switch swithc between `lib` or `build/lib` or `dist`, we need to update this
  fs.copyFileSync(
    path.join(rootDir, 'build', 'Release', 'ctrlc.node'),
    path.join(rootDir, 'build', 'lib', 'ctrlc.node')
  )
} catch (e) {
  console.warn('Warning: Could not copy native addon:', e.message)
}
