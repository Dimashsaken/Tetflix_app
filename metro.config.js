const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfill for fetch if needed
config.resolver.sourceExts.push('cjs');

module.exports = config;
