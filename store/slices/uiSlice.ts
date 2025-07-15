import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Modal {
  id: string;
  type: 'confirmation' | 'loading' | 'info' | 'error';
  title: string;
  content: string;
  buttons?: Array<{
    label: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
}

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
}

interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
}

interface UIState {
  // Loading states
  globalLoading: LoadingState;
  loadingStates: Record<string, LoadingState>;
  
  // Modals and overlays
  toasts: Toast[];
  modals: Modal[];
  activeModal: string | null;
  
  // Navigation
  currentScreen: string;
  previousScreen: string | null;
  canGoBack: boolean;
  
  // UI preferences
  preferences: UIPreferences;
  
  // Layout
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Network
  network: NetworkState;
  
  // App state
  appState: 'active' | 'background' | 'inactive';
  isFirstLaunch: boolean;
  hasSeenOnboarding: boolean;
  
  // Error handling
  lastError: string | null;
  errorCount: number;
  
  // Performance
  performanceMetrics: {
    appStartTime: number | null;
    lastRenderTime: number | null;
    memoryUsage: number | null;
  };
}

const initialState: UIState = {
  // Loading states
  globalLoading: {
    isLoading: false,
    message: '',
  },
  loadingStates: {},
  
  // Modals and overlays
  toasts: [],
  modals: [],
  activeModal: null,
  
  // Navigation
  currentScreen: 'home',
  previousScreen: null,
  canGoBack: false,
  
  // UI preferences
  preferences: {
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    soundEffects: true,
    hapticFeedback: true,
  },
  
  // Layout
  orientation: 'portrait',
  safeAreaInsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Network
  network: {
    isConnected: true,
    isInternetReachable: true,
    connectionType: null,
  },
  
  // App state
  appState: 'active',
  isFirstLaunch: true,
  hasSeenOnboarding: false,
  
  // Error handling
  lastError: null,
  errorCount: 0,
  
  // Performance
  performanceMetrics: {
    appStartTime: null,
    lastRenderTime: null,
    memoryUsage: null,
  },
};

// Create slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<Partial<LoadingState>>) => {
      state.globalLoading = { ...state.globalLoading, ...action.payload };
    },
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: Partial<LoadingState> }>) => {
      const { key, loading } = action.payload;
      state.loadingStates[key] = { ...state.loadingStates[key], ...loading };
    },
    clearLoadingState: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload];
    },
    
    // Toast management
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
      
      // Limit to 5 toasts
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // Modal management
    addModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.modals.push(modal);
      state.activeModal = modal.id;
    },
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
      
      // Set active modal to the last one in the stack
      if (state.modals.length > 0) {
        state.activeModal = state.modals[state.modals.length - 1].id;
      } else {
        state.activeModal = null;
      }
    },
    clearModals: (state) => {
      state.modals = [];
      state.activeModal = null;
    },
    
    // Navigation
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.previousScreen = state.currentScreen;
      state.currentScreen = action.payload;
    },
    setCanGoBack: (state, action: PayloadAction<boolean>) => {
      state.canGoBack = action.payload;
    },
    
    // UI preferences
    setPreferences: (state, action: PayloadAction<Partial<UIPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    resetPreferences: (state) => {
      state.preferences = initialState.preferences;
    },
    
    // Layout
    setOrientation: (state, action: PayloadAction<'portrait' | 'landscape'>) => {
      state.orientation = action.payload;
    },
    setSafeAreaInsets: (state, action: PayloadAction<Partial<UIState['safeAreaInsets']>>) => {
      state.safeAreaInsets = { ...state.safeAreaInsets, ...action.payload };
    },
    
    // Network
    setNetworkState: (state, action: PayloadAction<Partial<NetworkState>>) => {
      state.network = { ...state.network, ...action.payload };
    },
    
    // App state
    setAppState: (state, action: PayloadAction<'active' | 'background' | 'inactive'>) => {
      state.appState = action.payload;
    },
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    setHasSeenOnboarding: (state, action: PayloadAction<boolean>) => {
      state.hasSeenOnboarding = action.payload;
    },
    
    // Error handling
    setLastError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
      if (action.payload) {
        state.errorCount += 1;
      }
    },
    clearError: (state) => {
      state.lastError = null;
    },
    resetErrorCount: (state) => {
      state.errorCount = 0;
    },
    
    // Performance
    setPerformanceMetrics: (state, action: PayloadAction<Partial<UIState['performanceMetrics']>>) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload };
    },
    
    // Utility actions
    showSuccessToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        message: action.payload,
        type: 'success',
        duration: 3000,
      };
      state.toasts.push(toast);
      
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    showErrorToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        message: action.payload,
        type: 'error',
        duration: 5000,
      };
      state.toasts.push(toast);
      
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    showWarningToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        message: action.payload,
        type: 'warning',
        duration: 4000,
      };
      state.toasts.push(toast);
      
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    showInfoToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        message: action.payload,
        type: 'info',
        duration: 3000,
      };
      state.toasts.push(toast);
      
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    
    // Confirmation modal
    showConfirmationModal: (state, action: PayloadAction<{
      title: string;
      content: string;
      onConfirm: () => void;
      onCancel?: () => void;
    }>) => {
      const { title, content, onConfirm, onCancel } = action.payload;
      const modal: Modal = {
        id: Date.now().toString(),
        type: 'confirmation',
        title,
        content,
        buttons: [
          {
            label: 'Cancel',
            onPress: onCancel || (() => {}),
            style: 'cancel',
          },
          {
            label: 'Confirm',
            onPress: onConfirm,
            style: 'destructive',
          },
        ],
      };
      state.modals.push(modal);
      state.activeModal = modal.id;
    },
    
    // Reset entire UI state
    resetUIState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  // Loading states
  setGlobalLoading,
  setLoadingState,
  clearLoadingState,
  
  // Toast management
  addToast,
  removeToast,
  clearToasts,
  
  // Modal management
  addModal,
  removeModal,
  clearModals,
  
  // Navigation
  setCurrentScreen,
  setCanGoBack,
  
  // UI preferences
  setPreferences,
  resetPreferences,
  
  // Layout
  setOrientation,
  setSafeAreaInsets,
  
  // Network
  setNetworkState,
  
  // App state
  setAppState,
  setFirstLaunch,
  setHasSeenOnboarding,
  
  // Error handling
  setLastError,
  clearError,
  resetErrorCount,
  
  // Performance
  setPerformanceMetrics,
  
  // Utility actions
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showConfirmationModal,
  
  // Reset
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingState = (key: string) => (state: { ui: UIState }) => state.ui.loadingStates[key];
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectCurrentScreen = (state: { ui: UIState }) => state.ui.currentScreen;
export const selectPreviousScreen = (state: { ui: UIState }) => state.ui.previousScreen;
export const selectCanGoBack = (state: { ui: UIState }) => state.ui.canGoBack;
export const selectUIPreferences = (state: { ui: UIState }) => state.ui.preferences;
export const selectOrientation = (state: { ui: UIState }) => state.ui.orientation;
export const selectSafeAreaInsets = (state: { ui: UIState }) => state.ui.safeAreaInsets;
export const selectNetworkState = (state: { ui: UIState }) => state.ui.network;
export const selectAppState = (state: { ui: UIState }) => state.ui.appState;
export const selectIsFirstLaunch = (state: { ui: UIState }) => state.ui.isFirstLaunch;
export const selectHasSeenOnboarding = (state: { ui: UIState }) => state.ui.hasSeenOnboarding;
export const selectLastError = (state: { ui: UIState }) => state.ui.lastError;
export const selectErrorCount = (state: { ui: UIState }) => state.ui.errorCount;
export const selectPerformanceMetrics = (state: { ui: UIState }) => state.ui.performanceMetrics;

// Computed selectors
export const selectIsLoading = (state: { ui: UIState }) => 
  state.ui.globalLoading.isLoading || Object.values(state.ui.loadingStates).some(loading => loading.isLoading);
export const selectHasModals = (state: { ui: UIState }) => state.ui.modals.length > 0;
export const selectHasToasts = (state: { ui: UIState }) => state.ui.toasts.length > 0;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.network.isConnected && state.ui.network.isInternetReachable;
export const selectTheme = (state: { ui: UIState }) => state.ui.preferences.theme;
