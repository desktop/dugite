// this appears to be fixed in v9, so we no longer need to test this corner
// case there
if (process.versions.node[0] !== '9') {
  describe('node shenanigans', () => {
    it('will fail to encode the maximum buffer length', done => {
      // this is the magic number according to https://github.com/nodejs/node/issues/3175
      // 256MB = 268435456 bytes
      // 268435441 bytes = 256MB - 15 bytes
      const buffer = Buffer.alloc(268435441)

      // Ensure it's filled with a valid character
      buffer.fill('a')

      try {
        buffer.toString('utf-8')
      } catch {
        // we expect this to happen
        done()
        return
      }

      done(new Error('The buffer was converted correctly, which should never happen'))
    })
  })
}
