import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import LoadingAnimation from './components/LoadingAnimation';

export default function SplashScreen() {
  const router = useRouter();
  
  const handleAnimationComplete = () => {
    // Navigate to the main app after the animation completes
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LoadingAnimation onAnimationComplete={handleAnimationComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
  },
}); 