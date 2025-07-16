import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

/**
 * Hook to ensure the framework is ready
 * @returns {boolean} - True when the framework is ready
 */
export function useFrameworkReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Only call window.frameworkReady on web platform
    if (Platform.OS === 'web') {
      window.frameworkReady?.();
    }
    // Set the ready state to true immediately for native platforms
    setIsReady(true);
  }, []);

  return isReady;
}
