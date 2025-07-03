import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, type AuthUser } from '../../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAmplifyConfigured: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  resendCode: (email: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);

  const checkAmplifyConfig = () => {
    try {
      // Check if required environment variables are present
      const userPoolId = process.env.EXPO_PUBLIC_AWS_USER_POOL_ID;
      const clientId = process.env.EXPO_PUBLIC_AWS_CLIENT_ID;
      
      const configured = !!(userPoolId && clientId);
      setIsAmplifyConfigured(configured);
      
      if (!configured) {
        console.log('Amplify not configured - running in guest mode');
      }
      
      return configured;
    } catch (error) {
      console.log('Amplify configuration check failed - running in guest mode');
      setIsAmplifyConfigured(false);
      return false;
    }
  };

  const refreshUser = async () => {
    if (!isAmplifyConfigured) {
      setUser(null);
      return;
    }

    try {
      // Add timeout to prevent hanging
      const userPromise = AuthService.getCurrentUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      );
      
      const currentUser = await Promise.race([userPromise, timeoutPromise]) as AuthUser | null;
      setUser(currentUser);
    } catch (error) {
      console.log('Auth check failed, continuing in guest mode:', error);
      setUser(null);
    }
  };

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const configured = checkAmplifyConfig();
      if (configured) {
        await refreshUser();
      }
    } catch (error) {
      console.log('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isAmplifyConfigured) {
      return {
        success: false,
        error: 'Authentication not configured. Please check your Amplify setup.',
      };
    }

    const result = await AuthService.signIn(email, password);
    if (result.success && !result.requiresConfirmation) {
      await refreshUser();
    }
    return result;
  };

  const signUp = async (email: string, password: string, attributes?: Record<string, string>) => {
    if (!isAmplifyConfigured) {
      return {
        success: false,
        error: 'Authentication not configured. Please check your Amplify setup.',
      };
    }

    const result = await AuthService.signUp(email, password, attributes);
    return result;
  };

  const confirmSignUp = async (email: string, code: string) => {
    if (!isAmplifyConfigured) {
      return {
        success: false,
        error: 'Authentication not configured. Please check your Amplify setup.',
      };
    }

    const result = await AuthService.confirmSignUp(email, code);
    if (result.success) {
      await refreshUser();
    }
    return result;
  };

  const resendCode = async (email: string) => {
    if (!isAmplifyConfigured) {
      return {
        success: false,
        error: 'Authentication not configured. Please check your Amplify setup.',
      };
    }

    return await AuthService.resendConfirmationCode(email);
  };

  const signOut = async () => {
    if (isAmplifyConfigured) {
      await AuthService.signOut();
    }
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isAmplifyConfigured,
    signIn,
    signUp,
    confirmSignUp,
    resendCode,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 