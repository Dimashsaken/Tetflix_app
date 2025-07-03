import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';
import ConfirmationScreen from './ConfirmationScreen';

type AuthScreens = 'signIn' | 'signUp' | 'confirmation';

interface AuthNavigatorProps {
  // Optional props for future customization
}

const AuthNavigator: React.FC<AuthNavigatorProps> = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreens>('signIn');
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const navigateToSignIn = () => {
    setCurrentScreen('signIn');
    setConfirmationEmail('');
  };

  const navigateToSignUp = () => {
    setCurrentScreen('signUp');
  };

  const navigateToConfirmation = (email: string) => {
    setConfirmationEmail(email);
    setCurrentScreen('confirmation');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'signIn':
        return (
          <SignInScreen 
            onNavigateToSignUp={navigateToSignUp}
          />
        );
      
      case 'signUp':
        return (
          <SignUpScreen 
            onNavigateToSignIn={navigateToSignIn}
            onNavigateToConfirmation={navigateToConfirmation}
          />
        );
      
      case 'confirmation':
        return (
          <ConfirmationScreen 
            email={confirmationEmail}
            onNavigateToSignIn={navigateToSignIn}
          />
        );
      
      default:
        return (
          <SignInScreen 
            onNavigateToSignUp={navigateToSignUp}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthNavigator; 