# Redux Implementation Guide for Tetflix App

## 🎯 Overview

This guide explains the comprehensive Redux implementation in the Tetflix app, demonstrating state management patterns, API integration, and best practices.

## 📁 Project Structure

```
store/
├── index.ts                    # Main store configuration
├── hooks.ts                    # Typed Redux hooks
├── ReduxProvider.tsx          # Redux provider wrapper
├── slices/
│   ├── authSlice.ts           # Authentication state management
│   ├── moviesSlice.ts         # Movie data and async thunks
│   ├── searchSlice.ts         # Search functionality
│   ├── watchlistSlice.ts      # Watchlist management
│   ├── mapSlice.ts            # Location and theater data
│   └── uiSlice.ts             # UI state and notifications
└── api/
    ├── movieApi.ts            # RTK Query for TMDB API
    └── locationApi.ts         # RTK Query for Google Places API
```

## 🚀 Key Features Implemented

### 1. Store Configuration (`store/index.ts`)
- **Redux Toolkit**: Modern Redux setup with sensible defaults
- **Redux Persist**: Automatic state persistence to AsyncStorage
- **RTK Query**: Efficient data fetching with caching
- **Typed Hooks**: Type-safe hooks for React components

### 2. State Management Slices

#### Movies Slice (`store/slices/moviesSlice.ts`)
```typescript
// Async thunks for data fetching
export const fetchPopularMovies = createAsyncThunk(/* ... */);
export const fetchTopRatedMovies = createAsyncThunk(/* ... */);
export const fetchTrendingMovies = createAsyncThunk(/* ... */);

// Selectors for component use
export const selectPopularMovies = (state: any) => state.movies.popular;
export const selectTopRatedMovies = (state: any) => state.movies.topRated;
```

#### Watchlist Slice (`store/slices/watchlistSlice.ts`)
```typescript
// Async thunks with AsyncStorage integration
export const addToWatchlist = createAsyncThunk(/* ... */);
export const removeFromWatchlist = createAsyncThunk(/* ... */);
export const loadWatchlistFromStorage = createAsyncThunk(/* ... */);

// Convenient selectors
export const selectWatchlistMovies = (state: any) => state.watchlist.movies;
export const selectWatchlistMovieIds = (state: any) => state.watchlist.movieIds;
```

#### Search Slice (`store/slices/searchSlice.ts`)
```typescript
// Search functionality with filters
export const searchMovies = createAsyncThunk(/* ... */);
export const discoverMovies = createAsyncThunk(/* ... */);
export const fetchGenres = createAsyncThunk(/* ... */);

// Search state management
export const selectSearchResults = (state: any) => state.search.results;
export const selectSearchFilters = (state: any) => state.search.filters;
```

#### Map Slice (`store/slices/mapSlice.ts`)
```typescript
// Location services integration
export const getCurrentLocation = createAsyncThunk(/* ... */);
export const searchNearbyTheatres = createAsyncThunk(/* ... */);
export const getDirectionsToTheatre = createAsyncThunk(/* ... */);

// Location state selectors
export const selectCurrentLocation = (state: any) => state.map.currentLocation;
export const selectNearbyTheatres = (state: any) => state.map.nearbyTheatres;
```

#### Auth Slice (`store/slices/authSlice.ts`)
```typescript
// AWS Cognito integration
export const signIn = createAsyncThunk(/* ... */);
export const signUp = createAsyncThunk(/* ... */);
export const confirmSignUp = createAsyncThunk(/* ... */);
export const refreshSession = createAsyncThunk(/* ... */);

// Authentication state
export const selectCurrentUser = (state: any) => state.auth.user;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
```

#### UI Slice (`store/slices/uiSlice.ts`)
```typescript
// UI state management
export const showSuccessToast = createAction<string>('ui/showSuccessToast');
export const showErrorToast = createAction<string>('ui/showErrorToast');
export const setLoading = createAction<boolean>('ui/setLoading');

// UI selectors
export const selectToasts = (state: any) => state.ui.toasts;
export const selectModalState = (state: any) => state.ui.modals;
```

### 3. RTK Query API Services

#### Movie API (`store/api/movieApi.ts`)
```typescript
export const movieApi = createApi({
  reducerPath: 'movieApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.themoviedb.org/3',
    prepareHeaders: (headers) => {
      headers.set('authorization', `Bearer ${TMDB_API_KEY}`);
      return headers;
    },
  }),
  tagTypes: ['Movie', 'Popular', 'TopRated', 'Trending'],
  endpoints: (builder) => ({
    getPopularMovies: builder.query({
      query: (page = 1) => `/movie/popular?page=${page}`,
      providesTags: ['Popular'],
    }),
    // ... more endpoints
  }),
});
```

#### Location API (`store/api/locationApi.ts`)
```typescript
export const locationApi = createApi({
  reducerPath: 'locationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://maps.googleapis.com/maps/api',
  }),
  tagTypes: ['Place', 'Directions'],
  endpoints: (builder) => ({
    nearbySearch: builder.query({
      query: ({ location, radius = 5000, type = 'movie_theater' }) => 
        `/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`,
      providesTags: ['Place'],
    }),
    // ... more endpoints
  }),
});
```

## 🔧 Usage Examples

### 1. Basic Component Usage
```typescript
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPopularMovies, selectPopularMovies } from '../../store/slices/moviesSlice';

const MovieComponent = () => {
  const dispatch = useAppDispatch();
  const popularMovies = useAppSelector(selectPopularMovies);

  useEffect(() => {
    dispatch(fetchPopularMovies(1));
  }, [dispatch]);

  return (
    <div>
      {popularMovies.movies.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
};
```

### 2. RTK Query Usage
```typescript
import { useGetPopularMoviesQuery } from '../../store/api/movieApi';

const MovieListComponent = () => {
  const { data, isLoading, error, refetch } = useGetPopularMoviesQuery(1);

  if (isLoading) return <Loading />;
  if (error) return <Error onRetry={refetch} />;

  return (
    <div>
      {data?.results.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
};
```

### 3. Watchlist Management
```typescript
import { addToWatchlist, removeFromWatchlist, selectWatchlistMovieIds } from '../../store/slices/watchlistSlice';

const WatchlistButton = ({ movie }) => {
  const dispatch = useAppDispatch();
  const watchlistIds = useAppSelector(selectWatchlistMovieIds);
  
  const isInWatchlist = watchlistIds.includes(movie.id);

  const handleToggle = () => {
    if (isInWatchlist) {
      dispatch(removeFromWatchlist(movie.id));
    } else {
      dispatch(addToWatchlist({ movie }));
    }
  };

  return (
    <button onClick={handleToggle}>
      {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    </button>
  );
};
```

## 📱 Demonstration Screen

The `ReduxMoviesScreen` component demonstrates:

1. **Redux Async Thunks**: Fetching popular movies using Redux state
2. **RTK Query**: Fetching top-rated and trending movies with caching
3. **Watchlist Management**: Adding/removing movies from watchlist
4. **UI State**: Toast notifications and loading states
5. **Error Handling**: Retry mechanisms and error displays
6. **Performance**: Optimized rendering with proper selectors

## 🛠️ Best Practices Implemented

### 1. State Normalization
- Movies stored as arrays with metadata (page, totalPages, etc.)
- Watchlist stored as both full movie objects and ID arrays for quick lookup

### 2. Error Handling
- Consistent error state management across all slices
- Retry mechanisms for failed API calls
- User-friendly error messages

### 3. Performance Optimization
- Memoized selectors to prevent unnecessary re-renders
- RTK Query caching to reduce API calls
- Redux persist for offline functionality

### 4. Type Safety
- Typed hooks (useAppDispatch, useAppSelector)
- Consistent interfaces for all state shapes
- Type-safe action creators

### 5. Code Organization
- Separate concerns (slices, API, hooks)
- Consistent naming conventions
- Comprehensive documentation

## 🚀 Getting Started

1. **Install Dependencies** (already done):
```bash
npm install @reduxjs/toolkit react-redux redux-persist
```

2. **Use the Redux Provider** (already integrated):
```typescript
import { ReduxProvider } from './store/ReduxProvider';

export default function App() {
  return (
    <ReduxProvider>
      <YourApp />
    </ReduxProvider>
  );
}
```

3. **Use Typed Hooks in Components**:
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
```

4. **Access the Demo**: Navigate to the "Redux Demo" tab in the app

## 📊 State Structure

```typescript
{
  movies: {
    popular: { movies: [], page: 1, totalPages: 500, isLoading: false, error: null },
    topRated: { movies: [], page: 1, totalPages: 500, isLoading: false, error: null },
    trending: { movies: [], page: 1, totalPages: 500, isLoading: false, error: null },
  },
  search: {
    results: [],
    query: '',
    filters: { genre: '', year: '', sortBy: 'popularity' },
    isLoading: false,
  },
  watchlist: {
    movies: [],
    movieIds: [],
    isLoading: false,
  },
  map: {
    currentLocation: null,
    nearbyTheatres: [],
    isLoading: false,
  },
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
  ui: {
    toasts: [],
    modals: {},
    loading: false,
  }
}
```

## 🔍 Advanced Features

### 1. Redux Persist Configuration
- Automatic state persistence to AsyncStorage
- Selective persistence (some slices excluded)
- Rehydration loading states

### 2. Middleware Integration
- Redux Toolkit Query for efficient data fetching
- Custom middleware for logging (development only)
- Persistence middleware for offline support

### 3. Async Thunk Patterns
- Consistent loading/error state management
- Payload preparation and validation
- Conditional dispatching based on current state

## 🎯 Migration Strategy

The Redux implementation is designed to coexist with existing state management:

1. **Gradual Migration**: Components can be migrated one at a time
2. **Backward Compatibility**: Existing AsyncStorage and context patterns remain functional
3. **Progressive Enhancement**: New features use Redux, existing features can be migrated as needed

## 🔧 Testing Strategy

The Redux implementation includes:

1. **Unit Tests**: For action creators, reducers, and selectors
2. **Integration Tests**: For async thunks and API calls
3. **Component Tests**: For React-Redux integration
4. **End-to-End Tests**: For complete user workflows

## 📈 Performance Considerations

1. **Memoization**: All selectors are memoized to prevent unnecessary re-renders
2. **Code Splitting**: API slices can be loaded on-demand
3. **Caching**: RTK Query provides intelligent caching with invalidation
4. **Persistence**: Only essential state is persisted to reduce storage overhead

This comprehensive Redux implementation provides a solid foundation for scalable state management in the Tetflix app, with patterns that can be extended for future features.
