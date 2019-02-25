module.exports = {
  roots: ['<rootDir>/lib/', '<rootDir>/test/'],
  testMatch: ['**/test/slow/**/*-test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/slow-setup.ts'],
  collectCoverageFrom: ['lib/**/*.{js,ts}', '!**/node_modules/**', '!**/index.ts'],
  coverageReporters: ['text-summary', 'json'],
  globals: {
    'ts-jest': {
      babelConfig: true
    }
  },
  preset: 'ts-jest'
}
