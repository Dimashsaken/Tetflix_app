import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import TetflixLogo from './TetflixLogo';

interface SplashTransitionProps {
  onAnimationComplete: () => void;
}

const SplashTransition: React.FC<SplashTransitionProps> = ({ onAnimationComplete }) => {
  // Animation references
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Netflix-style animation sequence
    const animationSequence = Animated.sequence([
      // Hold for a moment
      Animated.delay(400),
      
      // Then animate scale and opacity simultaneously
      Animated.parallel([
        // Scale up slightly
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        
        // Then fade out
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 800,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
    ]);
    
    // Start the animation and notify when complete
    animationSequence.start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [onAnimationComplete]);
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TetflixLogo width={200} height={60} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#13111C', // Dark background like Netflix
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashTransition; 