import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDB_API_KEY } from '../../app/config/api';
import { Movie } from './moviesSlice';

// Types
interface WatchlistMovie extends Movie {
  addedAt: string;
  userRating?: number;
  userNotes?: string;
}

interface WatchlistState {
  movies: WatchlistMovie[];
  movieIds: number[];
  isLoading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt: string | null;
  sortBy: 'addedAt' | 'title' | 'rating' | 'releaseDate';
  sortOrder: 'asc' | 'desc';
  filterBy: 'all' | 'rated' | 'unrated';
}

const initialState: WatchlistState = {
  movies: [],
  movieIds: [],
  isLoading: false,
  error: null,
  syncStatus: 'idle',
  lastSyncAt: null,
  sortBy: 'addedAt',
  sortOrder: 'desc',
  filterBy: 'all',
};

// Async thunks
export const loadWatchlistFromStorage = createAsyncThunk(
  'watchlist/loadFromStorage',
  async () => {
    try {
      const watchlistData = await AsyncStorage.getItem('watchlist');
      if (watchlistData) {
        const movieIds: number[] = JSON.parse(watchlistData);
        return movieIds;
      }
      return [];
    } catch (error) {
      console.error('Error loading watchlist:', error);
      return [];
    }
  }
);

export const saveWatchlistToStorage = createAsyncThunk(
  'watchlist/saveToStorage',
  async (movieIds: number[]) => {
    try {
      await AsyncStorage.setItem('watchlist', JSON.stringify(movieIds));
      return movieIds;
    } catch (error) {
      console.error('Error saving watchlist:', error);
      throw error;
    }
  }
);

export const fetchWatchlistMovies = createAsyncThunk(
  'watchlist/fetchMovies',
  async (movieIds: number[]) => {
    try {
      const moviePromises = movieIds.map(async (id) => {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: {
            api_key: TMDB_API_KEY,
          },
        });
        return response.data;
      });

      const movies = await Promise.all(moviePromises);
      return movies;
    } catch (error) {
      console.error('Error fetching watchlist movies:', error);
      throw error;
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/addMovie',
  async ({ movie, userRating, userNotes }: { movie: Movie; userRating?: number; userNotes?: string }, { getState, dispatch }) => {
    const state = getState() as { watchlist: WatchlistState };
    const currentIds = state.watchlist.movieIds;
    
    if (currentIds.includes(movie.id)) {
      throw new Error('Movie already in watchlist');
    }

    const watchlistMovie: WatchlistMovie = {
      ...movie,
      addedAt: new Date().toISOString(),
      userRating,
      userNotes,
    };

    const newIds = [movie.id, ...currentIds];
    await dispatch(saveWatchlistToStorage(newIds));
    
    return watchlistMovie;
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/removeMovie',
  async (movieId: number, { getState, dispatch }) => {
    const state = getState() as { watchlist: WatchlistState };
    const currentIds = state.watchlist.movieIds;
    
    const newIds = currentIds.filter(id => id !== movieId);
    await dispatch(saveWatchlistToStorage(newIds));
    
    return movieId;
  }
);

export const updateWatchlistMovie = createAsyncThunk(
  'watchlist/updateMovie',
  async ({ movieId, updates }: { movieId: number; updates: Partial<WatchlistMovie> }) => {
    return { movieId, updates };
  }
);

export const clearWatchlist = createAsyncThunk(
  'watchlist/clear',
  async (_, { dispatch }) => {
    await dispatch(saveWatchlistToStorage([]));
    return null;
  }
);

// Create slice
const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setSortBy: (state, action: PayloadAction<'addedAt' | 'title' | 'rating' | 'releaseDate'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setFilterBy: (state, action: PayloadAction<'all' | 'rated' | 'unrated'>) => {
      state.filterBy = action.payload;
    },
    toggleSort: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    updateMovieRating: (state, action: PayloadAction<{ movieId: number; rating: number }>) => {
      const movie = state.movies.find(m => m.id === action.payload.movieId);
      if (movie) {
        movie.userRating = action.payload.rating;
      }
    },
    updateMovieNotes: (state, action: PayloadAction<{ movieId: number; notes: string }>) => {
      const movie = state.movies.find(m => m.id === action.payload.movieId);
      if (movie) {
        movie.userNotes = action.payload.notes;
      }
    },
    resetWatchlistState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Load watchlist from storage
    builder
      .addCase(loadWatchlistFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWatchlistFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movieIds = action.payload;
      })
      .addCase(loadWatchlistFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load watchlist';
      })
      
      // Save watchlist to storage
      .addCase(saveWatchlistToStorage.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(saveWatchlistToStorage.fulfilled, (state, action) => {
        state.movieIds = action.payload;
        state.syncStatus = 'success';
        state.lastSyncAt = new Date().toISOString();
      })
      .addCase(saveWatchlistToStorage.rejected, (state, action) => {
        state.syncStatus = 'error';
        state.error = action.error.message || 'Failed to save watchlist';
      })
      
      // Fetch watchlist movies
      .addCase(fetchWatchlistMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlistMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = action.payload.map((movie: Movie) => ({
          ...movie,
          addedAt: new Date().toISOString(), // Default value, should be updated from local storage
        }));
      })
      .addCase(fetchWatchlistMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch watchlist movies';
      })
      
      // Add to watchlist
      .addCase(addToWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = [action.payload, ...state.movies];
        state.movieIds = [action.payload.id, ...state.movieIds];
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to add to watchlist';
      })
      
      // Remove from watchlist
      .addCase(removeFromWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = state.movies.filter(movie => movie.id !== action.payload);
        state.movieIds = state.movieIds.filter(id => id !== action.payload);
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to remove from watchlist';
      })
      
      // Update watchlist movie
      .addCase(updateWatchlistMovie.fulfilled, (state, action) => {
        const { movieId, updates } = action.payload;
        const movie = state.movies.find(m => m.id === movieId);
        if (movie) {
          Object.assign(movie, updates);
        }
      })
      
      // Clear watchlist
      .addCase(clearWatchlist.fulfilled, (state) => {
        state.movies = [];
        state.movieIds = [];
        state.lastSyncAt = new Date().toISOString();
      });
  },
});

export const {
  setSortBy,
  setSortOrder,
  setFilterBy,
  toggleSort,
  updateMovieRating,
  updateMovieNotes,
  resetWatchlistState,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;

// Selectors
export const selectWatchlistMovies = (state: any) => {
  const { movies, sortBy, sortOrder, filterBy } = state.watchlist;
  
  // Filter movies
  let filteredMovies = movies;
  if (filterBy === 'rated') {
    filteredMovies = movies.filter((movie: any) => movie.userRating !== undefined);
  } else if (filterBy === 'unrated') {
    filteredMovies = movies.filter((movie: any) => movie.userRating === undefined);
  }
  
  // Sort movies
  const sortedMovies = [...filteredMovies].sort((a: any, b: any) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'rating':
        aValue = a.vote_average || 0;
        bValue = b.vote_average || 0;
        break;
      case 'releaseDate':
        aValue = new Date(a.release_date || '').getTime();
        bValue = new Date(b.release_date || '').getTime();
        break;
      case 'addedAt':
      default:
        aValue = new Date(a.addedAt).getTime();
        bValue = new Date(b.addedAt).getTime();
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  
  return sortedMovies;
};

export const selectWatchlistMovieIds = (state: any) => state.watchlist.movieIds;
export const selectWatchlistLoading = (state: any) => state.watchlist.isLoading;
export const selectWatchlistError = (state: any) => state.watchlist.error;
export const selectWatchlistSyncStatus = (state: any) => state.watchlist.syncStatus;
export const selectWatchlistSortOptions = (state: any) => ({
  sortBy: state.watchlist.sortBy,
  sortOrder: state.watchlist.sortOrder,
  filterBy: state.watchlist.filterBy,
});
export const selectIsInWatchlist = (movieId: number) => (state: any) => 
  state.watchlist.movieIds.includes(movieId);
export const selectWatchlistStats = (state: any) => ({
  totalMovies: state.watchlist.movies.length,
  ratedMovies: state.watchlist.movies.filter((m: any) => m.userRating !== undefined).length,
  unratedMovies: state.watchlist.movies.filter((m: any) => m.userRating === undefined).length,
  averageRating: state.watchlist.movies.reduce((sum: number, m: any) => sum + (m.userRating || 0), 0) / state.watchlist.movies.length,
});
