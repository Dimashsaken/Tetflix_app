import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TMDB_API_KEY } from '../../app/config/api';

// Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
  vote_count: number;
}

interface MoviesState {
  popular: {
    movies: Movie[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  topRated: {
    movies: Movie[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  trending: {
    movies: Movie[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  nowPlaying: {
    movies: Movie[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  upcoming: {
    movies: Movie[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  isInitialized: boolean;
}

const initialState: MoviesState = {
  popular: {
    movies: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  topRated: {
    movies: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  trending: {
    movies: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  nowPlaying: {
    movies: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  upcoming: {
    movies: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  isInitialized: false,
};

// Async thunks
export const fetchPopularMovies = createAsyncThunk(
  'movies/fetchPopular',
  async (page: number = 1) => {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/popular',
      {
        params: {
          api_key: TMDB_API_KEY,
          page,
        },
      }
    );
    return { data: response.data, page };
  }
);

export const fetchTopRatedMovies = createAsyncThunk(
  'movies/fetchTopRated',
  async (page: number = 1) => {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/top_rated',
      {
        params: {
          api_key: TMDB_API_KEY,
          page,
        },
      }
    );
    return { data: response.data, page };
  }
);

export const fetchTrendingMovies = createAsyncThunk(
  'movies/fetchTrending',
  async (page: number = 1) => {
    const response = await axios.get(
      'https://api.themoviedb.org/3/trending/movie/day',
      {
        params: {
          api_key: TMDB_API_KEY,
          page,
        },
      }
    );
    return { data: response.data, page };
  }
);

export const fetchNowPlayingMovies = createAsyncThunk(
  'movies/fetchNowPlaying',
  async (page: number = 1) => {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        params: {
          api_key: TMDB_API_KEY,
          page,
        },
      }
    );
    return { data: response.data, page };
  }
);

export const fetchUpcomingMovies = createAsyncThunk(
  'movies/fetchUpcoming',
  async (page: number = 1) => {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/upcoming',
      {
        params: {
          api_key: TMDB_API_KEY,
          page,
        },
      }
    );
    return { data: response.data, page };
  }
);

// Create slice
const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearMovies: (state) => {
      Object.assign(state, initialState);
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Popular movies
    builder
      .addCase(fetchPopularMovies.pending, (state) => {
        state.popular.isLoading = true;
        state.popular.error = null;
      })
      .addCase(fetchPopularMovies.fulfilled, (state, action) => {
        state.popular.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.popular.movies = data.results;
        } else {
          state.popular.movies = [...state.popular.movies, ...data.results];
        }
        
        state.popular.page = page;
        state.popular.totalPages = data.total_pages;
      })
      .addCase(fetchPopularMovies.rejected, (state, action) => {
        state.popular.isLoading = false;
        state.popular.error = action.error.message || 'Failed to fetch popular movies';
      })
      
      // Top rated movies
      .addCase(fetchTopRatedMovies.pending, (state) => {
        state.topRated.isLoading = true;
        state.topRated.error = null;
      })
      .addCase(fetchTopRatedMovies.fulfilled, (state, action) => {
        state.topRated.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.topRated.movies = data.results;
        } else {
          state.topRated.movies = [...state.topRated.movies, ...data.results];
        }
        
        state.topRated.page = page;
        state.topRated.totalPages = data.total_pages;
      })
      .addCase(fetchTopRatedMovies.rejected, (state, action) => {
        state.topRated.isLoading = false;
        state.topRated.error = action.error.message || 'Failed to fetch top rated movies';
      })
      
      // Trending movies
      .addCase(fetchTrendingMovies.pending, (state) => {
        state.trending.isLoading = true;
        state.trending.error = null;
      })
      .addCase(fetchTrendingMovies.fulfilled, (state, action) => {
        state.trending.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.trending.movies = data.results;
        } else {
          state.trending.movies = [...state.trending.movies, ...data.results];
        }
        
        state.trending.page = page;
        state.trending.totalPages = data.total_pages;
      })
      .addCase(fetchTrendingMovies.rejected, (state, action) => {
        state.trending.isLoading = false;
        state.trending.error = action.error.message || 'Failed to fetch trending movies';
      })
      
      // Now playing movies
      .addCase(fetchNowPlayingMovies.pending, (state) => {
        state.nowPlaying.isLoading = true;
        state.nowPlaying.error = null;
      })
      .addCase(fetchNowPlayingMovies.fulfilled, (state, action) => {
        state.nowPlaying.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.nowPlaying.movies = data.results;
        } else {
          state.nowPlaying.movies = [...state.nowPlaying.movies, ...data.results];
        }
        
        state.nowPlaying.page = page;
        state.nowPlaying.totalPages = data.total_pages;
      })
      .addCase(fetchNowPlayingMovies.rejected, (state, action) => {
        state.nowPlaying.isLoading = false;
        state.nowPlaying.error = action.error.message || 'Failed to fetch now playing movies';
      })
      
      // Upcoming movies
      .addCase(fetchUpcomingMovies.pending, (state) => {
        state.upcoming.isLoading = true;
        state.upcoming.error = null;
      })
      .addCase(fetchUpcomingMovies.fulfilled, (state, action) => {
        state.upcoming.isLoading = false;
        const { data, page } = action.payload;
        
        if (page === 1) {
          state.upcoming.movies = data.results;
        } else {
          state.upcoming.movies = [...state.upcoming.movies, ...data.results];
        }
        
        state.upcoming.page = page;
        state.upcoming.totalPages = data.total_pages;
      })
      .addCase(fetchUpcomingMovies.rejected, (state, action) => {
        state.upcoming.isLoading = false;
        state.upcoming.error = action.error.message || 'Failed to fetch upcoming movies';
      });
  },
});

export const { clearMovies, setInitialized } = moviesSlice.actions;
export default moviesSlice.reducer;

// Selectors
export const selectPopularMovies = (state: any) => state.movies.popular;
export const selectTopRatedMovies = (state: any) => state.movies.topRated;
export const selectTrendingMovies = (state: any) => state.movies.trending;
export const selectNowPlayingMovies = (state: any) => state.movies.nowPlaying;
export const selectUpcomingMovies = (state: any) => state.movies.upcoming;
export const selectIsMoviesInitialized = (state: any) => state.movies.isInitialized;
