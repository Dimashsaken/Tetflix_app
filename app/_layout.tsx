import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import SplashTransition from './components/SplashTransition';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore error */
});

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState('(tabs)');
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const isFrameworkReady = useFrameworkReady(); // Now returns a boolean
  
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Simulate a short loading time
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && isFrameworkReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync().catch(() => {
        /* Ignore error */
      });
    }
  }, [appIsReady, isFrameworkReady]);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  if (!appIsReady || !isFrameworkReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {!animationComplete && <SplashTransition onAnimationComplete={handleAnimationComplete} />}
      <Stack initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}
