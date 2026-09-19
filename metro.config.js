const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      /[/\\]android[/\\].*/,
      /[/\\]ios[/\\].*/,
      /[/\\]\.git[/\\].*/,
      /[/\\]prisma[/\\].*/,
    ],
    extraNodeModules: {
      '@react-native/assets-registry': path.resolve(
        __dirname,
        'metro-shims/@react-native/assets-registry',
      ),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
