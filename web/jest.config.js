module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '^.+\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(svg|png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/'],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage/',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/']
};
