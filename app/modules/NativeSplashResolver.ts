import React from 'react';

/**
 * Native Splash Screen Resolver
 * Provides a default export component for the module to satisfy router requirements
 */
const NativeSplashResolver: React.FC = () => {
  // This component doesn't render anything
  return null;
};

export default NativeSplashResolver;

// Other exports related to splash screen functionality
export const preventAutoHide = async () => {
  // Logic to prevent auto hiding of splash screen
};

export const hideSplashScreen = async () => {
  // Logic to hide the splash screen
}; 