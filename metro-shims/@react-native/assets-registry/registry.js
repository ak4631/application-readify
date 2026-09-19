// Shim for RN 0.87+, which folded the old standalone `@react-native/assets-registry`
// package into `react-native/src/asset-registry`. Some third-party libraries
// (e.g. react-native-svg) still import the old package path directly, so we
// redirect it here via Metro's `resolver.extraNodeModules` (see metro.config.js).
module.exports = require('react-native/src/asset-registry');
