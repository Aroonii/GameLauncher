const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure react-native-gesture-handler is properly resolved
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths || [],
  `${__dirname}/node_modules`,
];

module.exports = config;