import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService, type AuthUser } from '../../app/services/authService';

// Types
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAmplifyConfigured: boolean;
  error: string | null;
  lastLoginTime: string | null;
  sessionExpiry: string | null;
  loginAttempts: number;
  isLocked: boolean;
  lockoutExpiry: string | null;
  preferences: {
    rememberMe: boolean;
    biometricEnabled: boolean;
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAmplifyConfigured: false,
  error: null,
  lastLoginTime: null,
  sessionExpiry: null,
  loginAttempts: 0,
  isLocked: false,
  lockoutExpiry: null,
  preferences: {
    rememberMe: false,
    biometricEnabled: false,
    notifications: true,
    theme: 'system',
  },
};

// Async thunks
export const checkAmplifyConfig = createAsyncThunk(
  'auth/checkAmplifyConfig',
  async () => {
    try {
      const userPoolId = process.env.EXPO_PUBLIC_AWS_USER_POOL_ID;
      const clientId = process.env.EXPO_PUBLIC_AWS_CLIENT_ID;
      return !!(userPoolId && clientId);
    } catch (error) {
      return false;
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      const isConfigured = await dispatch(checkAmplifyConfig()).unwrap();
      
      if (!isConfigured) {
        return { user: null, isAuthenticated: false, isAmplifyConfigured: false };
      }
      
      const currentUser = await AuthService.getCurrentUser();
      const isAuthenticated = !!currentUser;
      
      return { 
        user: currentUser, 
        isAuthenticated, 
        isAmplifyConfigured: true 
      };
    } catch (error) {
      console.error('Auth initialization error:', error);
      return { user: null, isAuthenticated: false, isAmplifyConfigured: false };
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    
    // Check if account is locked
    if (state.auth.isLocked) {
      const now = new Date();
      const lockoutExpiry = new Date(state.auth.lockoutExpiry!);
      
      if (now < lockoutExpiry) {
        return rejectWithValue('Account is temporarily locked. Please try again later.');
      }
    }
    
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.success && !result.requiresConfirmation) {
        // Get the current user after successful sign in
        const user = await AuthService.getCurrentUser();
        
        if (user) {
          return {
            user,
            sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          };
        } else {
          throw new Error('Failed to get user after sign in');
        }
      } else if (result.requiresConfirmation) {
        throw new Error('Account requires confirmation. Please check your email.');
      } else {
        throw new Error(result.error || 'Sign in failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ 
    email, 
    password, 
    confirmPassword 
  }: { 
    email: string; 
    password: string; 
    confirmPassword: string 
  }, { rejectWithValue }) => {
    if (password !== confirmPassword) {
      return rejectWithValue('Passwords do not match');
    }
    
    try {
      const result = await AuthService.signUp(email, password);
      
      if (result.success) {
        return { email, needsConfirmation: true };
      } else {
        throw new Error(result.error || 'Sign up failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign up failed');
    }
  }
);

export const confirmSignUp = createAsyncThunk(
  'auth/confirmSignUp',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const result = await AuthService.confirmSignUp(email, code);
      
      if (result.success) {
        return { email };
      } else {
        throw new Error(result.error || 'Confirmation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Confirmation failed');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async () => {
    try {
      await AuthService.signOut();
      return null;
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Even if sign out fails, we should clear the local state
      return null;
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      // For now, return a placeholder since the method doesn't exist in AuthService
      // TODO: Implement password reset functionality in AuthService
      return { email, message: 'Password reset functionality not yet implemented' };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const confirmResetPassword = createAsyncThunk(
  'auth/confirmResetPassword',
  async ({ 
    email, 
    code, 
    newPassword 
  }: { 
    email: string; 
    code: string; 
    newPassword: string 
  }, { rejectWithValue }) => {
    try {
      // For now, return a placeholder since the method doesn't exist in AuthService
      // TODO: Implement password reset confirmation functionality in AuthService
      return { email, message: 'Password reset confirmation functionality not yet implemented' };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset confirmation failed');
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser) {
        return {
          user: currentUser,
          sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      } else {
        throw new Error('No valid session found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Session refresh failed');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPreferences: (state, action: PayloadAction<Partial<AuthState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (state.loginAttempts >= 5) {
        state.isLocked = true;
        state.lockoutExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.isLocked = false;
      state.lockoutExpiry = null;
    },
    checkSessionExpiry: (state) => {
      if (state.sessionExpiry) {
        const now = new Date();
        const expiry = new Date(state.sessionExpiry);
        
        if (now >= expiry) {
          state.user = null;
          state.isAuthenticated = false;
          state.sessionExpiry = null;
          state.error = 'Session expired. Please sign in again.';
        }
      }
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    resetAuthState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Check Amplify config
    builder
      .addCase(checkAmplifyConfig.fulfilled, (state, action) => {
        state.isAmplifyConfigured = action.payload;
      })
      
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isAmplifyConfigured = action.payload.isAmplifyConfigured;
        
        if (action.payload.isAuthenticated) {
          state.lastLoginTime = new Date().toISOString();
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Authentication initialization failed';
      })
      
      // Sign in
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.lastLoginTime = new Date().toISOString();
        state.sessionExpiry = action.payload.sessionExpiry;
        state.loginAttempts = 0;
        state.isLocked = false;
        state.lockoutExpiry = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
        
        // Lock account after 5 failed attempts
        if (state.loginAttempts >= 5) {
          state.isLocked = true;
          state.lockoutExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
      })
      
      // Sign up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Confirm sign up
      .addCase(confirmSignUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmSignUp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(confirmSignUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.lastLoginTime = null;
        state.sessionExpiry = null;
        state.error = null;
      })
      .addCase(signOut.rejected, (state) => {
        state.isLoading = false;
        // Clear state even if sign out fails
        state.user = null;
        state.isAuthenticated = false;
        state.lastLoginTime = null;
        state.sessionExpiry = null;
      })
      
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Confirm reset password
      .addCase(confirmResetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmResetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(confirmResetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh session
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.sessionExpiry;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionExpiry = null;
      });
  },
});

export const {
  clearError,
  setPreferences,
  incrementLoginAttempts,
  resetLoginAttempts,
  checkSessionExpiry,
  updateUser,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAmplifyConfigured = (state: { auth: AuthState }) => state.auth.isAmplifyConfigured;
export const selectAuthPreferences = (state: { auth: AuthState }) => state.auth.preferences;
export const selectIsAccountLocked = (state: { auth: AuthState }) => state.auth.isLocked;
export const selectLoginAttempts = (state: { auth: AuthState }) => state.auth.loginAttempts;
export const selectSessionExpiry = (state: { auth: AuthState }) => state.auth.sessionExpiry;
