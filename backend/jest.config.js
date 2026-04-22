// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/__tests__/**'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  verbose: true
};
