import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import moviesReducer from './slices/moviesSlice';
import searchReducer from './slices/searchSlice';
import watchlistReducer from './slices/watchlistSlice';
import mapReducer from './slices/mapSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// Import API services
import { movieApi } from './api/movieApi';
import { locationApi } from './api/locationApi';

// Redux persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['watchlist', 'auth', 'ui'], // Only persist these slices
};

// Root reducer
const rootReducer = combineReducers({
  movies: moviesReducer,
  search: searchReducer,
  watchlist: watchlistReducer,
  map: mapReducer,
  auth: authReducer,
  ui: uiReducer,
  [movieApi.reducerPath]: movieApi.reducer,
  [locationApi.reducerPath]: locationApi.reducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(movieApi.middleware)
    .concat(locationApi.middleware),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks
import { useAppDispatch, useAppSelector } from './hooks';
export { useAppDispatch, useAppSelector };
