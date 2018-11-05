module.exports = {
  roots: ['<rootDir>/lib/', '<rootDir>/test/'],
  testMatch: ['**/test/fast/*.ts'],
  setupFiles: ['<rootDir>/test/fast-setup.ts'],
  collectCoverageFrom: ['lib/**/*.{js,ts}', '!**/node_modules/**', '!**/index.ts'],
  coverageReporters: ['text-summary', 'json'],
  globals: {
    'ts-jest': {
      babelConfig: true
    }
  },
  preset: 'ts-jest'
}
