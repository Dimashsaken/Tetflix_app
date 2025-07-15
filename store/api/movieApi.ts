import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TMDB_API_KEY } from '../../app/config/api';

// Base URL for TMDB API
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

export interface MovieDetails extends Movie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  tagline: string;
  homepage: string;
  budget: number;
  revenue: number;
  status: string;
  belongs_to_collection: any;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface SearchFilters {
  query?: string;
  year?: number;
  genre?: number;
  sort_by?: string;
  include_adult?: boolean;
  page?: number;
}

// Create API slice
export const movieApi = createApi({
  reducerPath: 'movieApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TMDB_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Authorization', `Bearer ${TMDB_API_KEY}`);
      return headers;
    },
  }),
  tagTypes: ['Movie', 'MovieDetails', 'Credits', 'Videos', 'Genres', 'Search'],
  endpoints: (builder) => ({
    // Movie lists
    getPopularMovies: builder.query<ApiResponse<Movie>, number>({
      query: (page = 1) => `/movie/popular?page=${page}`,
      providesTags: ['Movie'],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    
    getTopRatedMovies: builder.query<ApiResponse<Movie>, number>({
      query: (page = 1) => `/movie/top_rated?page=${page}`,
      providesTags: ['Movie'],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    
    getTrendingMovies: builder.query<ApiResponse<Movie>, number>({
      query: (page = 1) => `/trending/movie/day?page=${page}`,
      providesTags: ['Movie'],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    
    getNowPlayingMovies: builder.query<ApiResponse<Movie>, number>({
      query: (page = 1) => `/movie/now_playing?page=${page}`,
      providesTags: ['Movie'],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    
    getUpcomingMovies: builder.query<ApiResponse<Movie>, number>({
      query: (page = 1) => `/movie/upcoming?page=${page}`,
      providesTags: ['Movie'],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    
    // Movie details
    getMovieDetails: builder.query<MovieDetails, number>({
      query: (movieId) => `/movie/${movieId}`,
      providesTags: (result, error, movieId) => [{ type: 'MovieDetails', id: movieId }],
    }),
    
    // Movie credits
    getMovieCredits: builder.query<Credits, number>({
      query: (movieId) => `/movie/${movieId}/credits`,
      providesTags: (result, error, movieId) => [{ type: 'Credits', id: movieId }],
    }),
    
    // Movie videos
    getMovieVideos: builder.query<{ results: MovieVideo[] }, number>({
      query: (movieId) => `/movie/${movieId}/videos`,
      providesTags: (result, error, movieId) => [{ type: 'Videos', id: movieId }],
    }),
    
    // Similar movies
    getSimilarMovies: builder.query<ApiResponse<Movie>, number>({
      query: (movieId) => `/movie/${movieId}/similar`,
      providesTags: (result, error, movieId) => [{ type: 'Movie', id: `similar-${movieId}` }],
    }),
    
    // Recommendations
    getMovieRecommendations: builder.query<ApiResponse<Movie>, number>({
      query: (movieId) => `/movie/${movieId}/recommendations`,
      providesTags: (result, error, movieId) => [{ type: 'Movie', id: `recommendations-${movieId}` }],
    }),
    
    // Search
    searchMovies: builder.query<ApiResponse<Movie>, SearchFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.query) params.append('query', filters.query);
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.include_adult !== undefined) params.append('include_adult', filters.include_adult.toString());
        if (filters.page) params.append('page', filters.page.toString());
        
        return `/search/movie?${params.toString()}`;
      },
      providesTags: ['Search'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
    
    // Discover movies
    discoverMovies: builder.query<ApiResponse<Movie>, SearchFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.genre) params.append('with_genres', filters.genre.toString());
        if (filters.include_adult !== undefined) params.append('include_adult', filters.include_adult.toString());
        if (filters.page) params.append('page', filters.page.toString());
        
        return `/discover/movie?${params.toString()}`;
      },
      providesTags: ['Search'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
    
    // Genres
    getGenres: builder.query<{ genres: Genre[] }, void>({
      query: () => '/genre/movie/list',
      providesTags: ['Genres'],
    }),
    
    // Multi search (movies, TV shows, people)
    multiSearch: builder.query<ApiResponse<any>, { query: string; page?: number }>({
      query: ({ query, page = 1 }) => `/search/multi?query=${encodeURIComponent(query)}&page=${page}`,
      providesTags: ['Search'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
    
    // Movie reviews
    getMovieReviews: builder.query<ApiResponse<any>, { movieId: number; page?: number }>({
      query: ({ movieId, page = 1 }) => `/movie/${movieId}/reviews?page=${page}`,
      providesTags: (result, error, { movieId }) => [{ type: 'Movie', id: `reviews-${movieId}` }],
    }),
    
    // Movie images
    getMovieImages: builder.query<{ backdrops: any[]; posters: any[] }, number>({
      query: (movieId) => `/movie/${movieId}/images`,
      providesTags: (result, error, movieId) => [{ type: 'Movie', id: `images-${movieId}` }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetPopularMoviesQuery,
  useGetTopRatedMoviesQuery,
  useGetTrendingMoviesQuery,
  useGetNowPlayingMoviesQuery,
  useGetUpcomingMoviesQuery,
  useGetMovieDetailsQuery,
  useGetMovieCreditsQuery,
  useGetMovieVideosQuery,
  useGetSimilarMoviesQuery,
  useGetMovieRecommendationsQuery,
  useSearchMoviesQuery,
  useDiscoverMoviesQuery,
  useGetGenresQuery,
  useMultiSearchQuery,
  useGetMovieReviewsQuery,
  useGetMovieImagesQuery,
  useLazySearchMoviesQuery,
  useLazyDiscoverMoviesQuery,
  useLazyMultiSearchQuery,
} = movieApi;

// Export manual query triggers
export const {
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getMovieRecommendations,
  searchMovies,
  discoverMovies,
  getGenres,
  multiSearch,
  getMovieReviews,
  getMovieImages,
} = movieApi.endpoints;
