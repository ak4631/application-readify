module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/env.js',
    '^react-native-razorpay$': '<rootDir>/__mocks__/react-native-razorpay.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native-community|@react-navigation|react-native-url-polyfill)/)',
  ],
};
