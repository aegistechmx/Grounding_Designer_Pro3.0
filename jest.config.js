// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@babel|react-scripts)/.*)/)'
  ],
  collectCoverageFrom: [
    'src/engine/physics/**/*.js',
    'src/engine/pipelines/**/*.js',
    'src/engine/standards/**/*.js',
    'src/engine/fem/solvers/**/*.js',
    'src/simulation/**/*.js',
    'src/domain/grounding/MultiLayerSoilModel.js',
    '!src/**/*.test.js',
    '!src/**/index.js',
    '!src/engine/autodesign/**/*.js',
    '!src/engine/fem/core/**/*.js',
    '!src/engine/fem/mesh/**/*.js',
    '!src/engine/fem/physics/**/*.js',
    '!src/engine/fem/postprocess/**/*.js',
    '!src/engine/fem/solver/**/*.js',
    '!src/engine/soil/**/*.js',
    '!src/engine/UnifiedEngine.js',
    '!src/engine/optimizerNSGA2.js',
    '!src/engine/standards/ComplianceEngine.js',
    '!src/engine/standards/ComplianceReport.js'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
    '<rootDir>/tests/**/*.{spec,test}.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
