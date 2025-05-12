import React from 'react';
import { View, StyleSheet } from 'react-native';
import TetflixLogo from './TetflixLogo';

/**
 * A simple loading screen component that displays during app bundling
 */
const BundlingLoadingScreen = () => {
  return (
    <View style={styles.container}>
      <TetflixLogo width={200} height={60} color="#E21221" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BundlingLoadingScreen; 