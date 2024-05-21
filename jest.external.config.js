const { testEnvironment } = require('./jest.config')

module.exports = {
  roots: ['<rootDir>/lib/', '<rootDir>/test/'],
  testMatch: ['**/test/external/**/*-test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/slow-setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/index.ts',
  ],
  coverageReporters: ['text-summary', 'json'],
  preset: 'ts-jest',
  testEnvironment: 'node',
}
