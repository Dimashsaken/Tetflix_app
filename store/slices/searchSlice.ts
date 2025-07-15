import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TMDB_API_KEY } from '../../app/config/api';
import { Movie } from './moviesSlice';

// Types
interface SearchFilters {
  sortBy: string;
  year: number | null;
  genre: number | null;
  rating: number | null;
  adult: boolean;
}

interface SearchState {
  query: string;
  results: Movie[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  filters: SearchFilters;
  viewMode: 'list' | 'grid';
  searchHistory: string[];
  recentSearches: Movie[];
  genreList: Array<{ id: number; name: string }>;
  hasSearched: boolean;
}

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
  totalResults: 0,
  filters: {
    sortBy: 'popularity.desc',
    year: null,
    genre: null,
    rating: null,
    adult: false,
  },
  viewMode: 'grid',
  searchHistory: [],
  recentSearches: [],
  genreList: [],
  hasSearched: false,
};

// Async thunks
export const searchMovies = createAsyncThunk(
  'search/searchMovies',
  async ({ query, page = 1, filters }: { query: string; page?: number; filters?: Partial<SearchFilters> }) => {
    const params: any = {
      api_key: TMDB_API_KEY,
      query,
      page,
      include_adult: filters?.adult || false,
    };

    if (filters?.year) {
      params.year = filters.year;
    }

    const response = await axios.get('https://api.themoviedb.org/3/search/movie', { params });
    return { data: response.data, page, query };
  }
);

export const discoverMovies = createAsyncThunk(
  'search/discoverMovies',
  async ({ page = 1, filters }: { page?: number; filters: SearchFilters }) => {
    const params: any = {
      api_key: TMDB_API_KEY,
      page,
      sort_by: filters.sortBy,
      include_adult: filters.adult,
    };

    if (filters.year) {
      params.year = filters.year;
    }

    if (filters.genre) {
      params.with_genres = filters.genre;
    }

    if (filters.rating) {
      params['vote_average.gte'] = filters.rating;
    }

    const response = await axios.get('https://api.themoviedb.org/3/discover/movie', { params });
    return { data: response.data, page };
  }
);

export const fetchGenres = createAsyncThunk(
  'search/fetchGenres',
  async () => {
    const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    return response.data.genres;
  }
);

export const fetchTrendingSearch = createAsyncThunk(
  'search/fetchTrendingSearch',
  async () => {
    const response = await axios.get('https://api.themoviedb.org/3/trending/movie/day', {
      params: {
        api_key: TMDB_API_KEY,
        page: 1,
      },
    });
    return response.data.results.slice(0, 10); // Get top 10 trending movies
  }
);

// Create slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearSearchResults: (state) => {
      state.results = [];
      state.page = 1;
      state.totalPages = 1;
      state.totalResults = 0;
      state.hasSearched = false;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // Reset page when filters change
    },
    setViewMode: (state, action: PayloadAction<'list' | 'grid'>) => {
      state.viewMode = action.payload;
    },
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory = [query, ...state.searchHistory.slice(0, 9)]; // Keep last 10 searches
      }
    },
    removeFromSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(item => item !== action.payload);
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    addToRecentSearches: (state, action: PayloadAction<Movie>) => {
      const movie = action.payload;
      const existingIndex = state.recentSearches.findIndex(m => m.id === movie.id);
      
      if (existingIndex > -1) {
        state.recentSearches.splice(existingIndex, 1);
      }
      
      state.recentSearches = [movie, ...state.recentSearches.slice(0, 9)]; // Keep last 10 movies
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    resetSearch: (state) => {
      state.query = '';
      state.results = [];
      state.page = 1;
      state.totalPages = 1;
      state.totalResults = 0;
      state.hasSearched = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Search movies
    builder
      .addCase(searchMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, page, query } = action.payload;
        
        if (page === 1) {
          state.results = data.results;
        } else {
          state.results = [...state.results, ...data.results];
        }
        
        state.page = page;
        state.totalPages = data.total_pages;
        state.totalResults = data.total_results;
        state.hasSearched = true;
        
        // Add to search history
        if (query.trim()) {
          const trimmedQuery = query.trim();
          if (!state.searchHistory.includes(trimmedQuery)) {
            state.searchHistory = [trimmedQuery, ...state.searchHistory.slice(0, 9)];
          }
        }
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to search movies';
      })
      
      // Discover movies
      .addCase(discoverMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(discoverMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.results = data.results;
        } else {
          state.results = [...state.results, ...data.results];
        }
        
        state.page = page;
        state.totalPages = data.total_pages;
        state.totalResults = data.total_results;
        state.hasSearched = true;
      })
      .addCase(discoverMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to discover movies';
      })
      
      // Fetch genres
      .addCase(fetchGenres.fulfilled, (state, action) => {
        state.genreList = action.payload;
      })
      
      // Fetch trending search
      .addCase(fetchTrendingSearch.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      });
  },
});

export const {
  setQuery,
  clearSearchResults,
  setFilters,
  setViewMode,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  addToRecentSearches,
  clearRecentSearches,
  resetSearch,
} = searchSlice.actions;

export default searchSlice.reducer;

// Selectors
export const selectSearchQuery = (state: { search: SearchState }) => state.search.query;
export const selectSearchResults = (state: { search: SearchState }) => state.search.results;
export const selectSearchLoading = (state: { search: SearchState }) => state.search.isLoading;
export const selectSearchError = (state: { search: SearchState }) => state.search.error;
export const selectSearchPagination = (state: { search: SearchState }) => ({
  page: state.search.page,
  totalPages: state.search.totalPages,
  totalResults: state.search.totalResults,
});
export const selectSearchFilters = (state: { search: SearchState }) => state.search.filters;
export const selectSearchViewMode = (state: { search: SearchState }) => state.search.viewMode;
export const selectSearchHistory = (state: { search: SearchState }) => state.search.searchHistory;
export const selectRecentSearches = (state: { search: SearchState }) => state.search.recentSearches;
export const selectGenreList = (state: { search: SearchState }) => state.search.genreList;
export const selectHasSearched = (state: { search: SearchState }) => state.search.hasSearched;
