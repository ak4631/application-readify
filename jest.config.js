module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '^@env$': '<rootDir>/__mocks__/env.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native-community|@react-navigation|react-native-url-polyfill)/)',
  ],
};
