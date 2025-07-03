import { Amplify } from 'aws-amplify';
import Constants from 'expo-constants';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: Constants.expoConfig?.extra?.EXPO_PUBLIC_AWS_USER_POOL_ID || process.env.EXPO_PUBLIC_AWS_USER_POOL_ID,
      userPoolClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_AWS_CLIENT_ID || process.env.EXPO_PUBLIC_AWS_CLIENT_ID,
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig; 