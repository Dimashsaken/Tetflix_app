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
import ReduxProvider from '../store/ReduxProvider';

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
  
  console.log('🔍 AppContent State:', { 
    appIsReady, 
    isFrameworkReady, 
    isLoading, 
    isAuthenticated, 
    isAmplifyConfigured,
    animationComplete 
  });
  
  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Starting app preparation...');
        // Pre-load fonts, make API calls, etc.
        // Simulate a short loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ App preparation complete');
      } catch (e) {
        console.warn('❌ App preparation failed:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        console.log('🎯 App is ready');
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && isFrameworkReady && !isLoading) {
      console.log('🎬 Hiding splash screen...');
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync().catch(() => {
        /* Ignore error */
      });
      console.log('🎬 Splash screen hidden');
    }
  }, [appIsReady, isFrameworkReady, isLoading]);

  const handleAnimationComplete = () => {
    console.log('✨ Animation complete - setting animationComplete to true');
    setAnimationComplete(true);
  };

  // Show loading while app or auth is initializing
  if (!appIsReady || !isFrameworkReady || isLoading) {
    console.log('⏳ Still loading...', { appIsReady, isFrameworkReady, isLoading });
    return null;
  }

  // If Amplify is not configured, show main app in guest mode
  if (!isAmplifyConfigured) {
    console.log('👤 Running in guest mode - authentication not configured');
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
  if (!isAuthenticated && isAmplifyConfigured) {
    console.log('🔐 Showing auth screens');
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {!animationComplete && <SplashTransition onAnimationComplete={handleAnimationComplete} />}
        <AuthNavigator />
      </View>
    );
  }

  // Show main app if user is authenticated
  console.log('🎉 Showing main app');
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
    <ReduxProvider>
      <AppInitializer>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppInitializer>
    </ReduxProvider>
  );
}
