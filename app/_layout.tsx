import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import SplashTransition from './components/SplashTransition';
import AppInitializer from './components/AppInitializer';
import AuthProvider, { useAuth } from './components/auth/AuthProvider';
import AuthNavigator from './components/auth/AuthNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore error */
});

// Main app content component
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isAmplifyConfigured } = useAuth();
  const [initialRoute, setInitialRoute] = useState('(tabs)');
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const isFrameworkReady = useFrameworkReady();
  
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
    if (appIsReady && isFrameworkReady && !isLoading) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync().catch(() => {
        /* Ignore error */
      });
    }
  }, [appIsReady, isFrameworkReady, isLoading]);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  // Show loading while app or auth is initializing
  if (!appIsReady || !isFrameworkReady || isLoading) {
    return null;
  }

  // If Amplify is not configured, show main app in guest mode
  if (!isAmplifyConfigured) {
    console.log('Running in guest mode - authentication not configured');
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

  // Show auth screens if user is not authenticated (and Amplify is configured)
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Show main app if user is authenticated
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
};

export default function RootLayout() {
  return (
    <AppInitializer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppInitializer>
  );
}
