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
<<<<<<< HEAD
  const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);

  const checkAmplifyConfig = () => {
=======
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = async () => {
    if (!isAmplifyConfigured) {
      setProfile(null);
      setProfileError(null);
      return;
    }

>>>>>>> 79c0fdc (feat: Implement movie management with Redux slices for movies, search, UI, and watchlist)
    try {
      // Check if required environment variables are present
      const userPoolId = process.env.EXPO_PUBLIC_AWS_USER_POOL_ID;
      const clientId = process.env.EXPO_PUBLIC_AWS_CLIENT_ID;
      
<<<<<<< HEAD
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
=======
      if (profileResult.success && profileResult.profile) {
        setProfile(profileResult.profile);
        setProfileError(null);
      } else {
        setProfile(null);
        setProfileError(profileResult.error || 'Could not fetch profile.');
      }
    } catch (error: any) {
      setProfile(null);
      setProfileError(error?.message || 'Could not fetch profile.');
    }
  };

  const ensureUserProfile = async (email?: string) => {
    if (!isAmplifyConfigured) {
      setProfileError(null);
      return;
    }

    try {
      const profileResult = await UserProfileService.ensureUserProfile(email);
      
      if (profileResult.success && profileResult.profile) {
        setProfile(profileResult.profile);
        setProfileError(null);
      } else {
        setProfile(null);
        setProfileError(profileResult.error || 'Could not create profile.');
      }
    } catch (error: any) {
      setProfile(null);
      setProfileError(error?.message || 'Could not create profile.');
>>>>>>> 79c0fdc (feat: Implement movie management with Redux slices for movies, search, UI, and watchlist)
    }
  };

  const refreshUser = async () => {
    if (!isAmplifyConfigured) {
      setUser(null);
<<<<<<< HEAD
=======
      setProfile(null);
      setProfileError(null);
>>>>>>> 79c0fdc (feat: Implement movie management with Redux slices for movies, search, UI, and watchlist)
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
<<<<<<< HEAD
    } catch (error) {
      console.log('Auth check failed, continuing in guest mode:', error);
      setUser(null);
=======
      if (currentUser) {
        await ensureUserProfile(currentUser.email);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    } catch (error: any) {
      setUser(null);
      setProfile(null);
      setProfileError(error?.message || 'Could not refresh user.');
    }
  };

  const retryProfileSetup = async () => {
    setIsLoading(true);
    setProfileError(null);
    try {
      await refreshUser();
    } finally {
      setIsLoading(false);
>>>>>>> 79c0fdc (feat: Implement movie management with Redux slices for movies, search, UI, and watchlist)
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

  if (profileError && user) {
    // Show error UI if profile setup failed
    return (
      <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111C' }}>
        <p style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>Profile Setup Error</p>
        <p style={{ color: '#fff', marginBottom: 16 }}>{profileError}</p>
        <button onClick={retryProfileSetup} style={{ backgroundColor: '#E50914', color: '#fff', padding: 10, borderRadius: 6, border: 'none', fontSize: 16 }}>Retry</button>
      </div>
    );
  }

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