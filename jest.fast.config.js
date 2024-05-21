const { testEnvironment } = require('./jest.external.config')

module.exports = {
  roots: ['<rootDir>/lib/', '<rootDir>/test/'],
  testMatch: ['**/test/fast/**/*-test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/fast-setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/index.ts',
  ],
  coverageReporters: ['text-summary', 'json'],
  preset: 'ts-jest',
  testEnvironment: 'node',
}
