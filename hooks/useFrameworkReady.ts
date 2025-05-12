import { useEffect, useState } from 'react';

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
    // Call the framework ready function if it exists
    window.frameworkReady?.();
    // Set the ready state to true
    setIsReady(true);
  }, []);

  return isReady;
}
