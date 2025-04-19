module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Add TypeScript transform plugin
      '@babel/plugin-transform-typescript'
    ],
  };
}; 