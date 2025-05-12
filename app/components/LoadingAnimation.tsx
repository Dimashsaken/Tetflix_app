import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import TetflixLogo from './TetflixLogo';

const { width } = Dimensions.get('window');

interface LoadingAnimationProps {
  onAnimationComplete?: () => void;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  onAnimationComplete 
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Simplified animation sequence - just fade in and scale up
    Animated.parallel([
      // Fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Delay before completing
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 600);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <TetflixLogo width={width * 0.7} height={width * 0.2} />
      </Animated.View>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingAnimation; 