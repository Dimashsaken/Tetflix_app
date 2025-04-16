import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDB_API_KEY, endpoints } from '../config/api';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  tagline: string;
  imdb_id: string;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string;
}

interface RelatedMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

interface UseMovieDataReturn {
  movie: MovieDetails | null;
  cast: CastMember[];
  crew: CrewMember[];
  similarMovies: RelatedMovie[];
  trailerKey: string | null;
  loading: boolean;
  error: string | null;
  isInWatchlist: boolean;
  toggleWatchlist: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

const useMovieData = (movieId: string): UseMovieDataReturn => {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [similarMovies, setSimilarMovies] = useState<RelatedMovie[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const getCacheKey = (type: string) => `movie_${movieId}_${type}`;
  const getCacheExpiryKey = (type: string) => `${getCacheKey(type)}_expiry`;

  const isCacheValid = async (type: string): Promise<boolean> => {
    const expiryTime = await AsyncStorage.getItem(getCacheExpiryKey(type));
    return expiryTime ? parseInt(expiryTime) > Date.now() : false;
  };

  const fetchFromCacheOrApi = async <T,>(
    type: string,
    apiEndpoint: string
  ): Promise<T | null> => {
    try {
      if (await isCacheValid(type)) {
        const cached = await AsyncStorage.getItem(getCacheKey(type));
        if (cached) return JSON.parse(cached);
      }

      const response = await axios.get(apiEndpoint, {
        params: { api_key: TMDB_API_KEY },
      });

      await AsyncStorage.setItem(getCacheKey(type), JSON.stringify(response.data));
      await AsyncStorage.setItem(
        getCacheExpiryKey(type),
        (Date.now() + CACHE_EXPIRY).toString()
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [movieData, creditsData, recommendationsData, videosData] = await Promise.all([
        fetchFromCacheOrApi<MovieDetails>('details', endpoints.movieDetails(movieId)),
        fetchFromCacheOrApi<{ cast: CastMember[]; crew: CrewMember[] }>('credits', endpoints.movieCredits(movieId)),
        fetchFromCacheOrApi<{ results: RelatedMovie[] }>('recommendations', endpoints.movieRecommendations(movieId)),
        fetchFromCacheOrApi<{ results: MovieVideo[] }>('videos', endpoints.movieVideos(movieId)),
      ]);

      if (!movieData) throw new Error('Failed to fetch movie data');

      setMovie(movieData);
      
      if (creditsData) {
        setCast(creditsData.cast.slice(0, 10));
        const directors = creditsData.crew.filter(member => member.job === 'Director');
        const writers = creditsData.crew.filter(member => 
          member.job === 'Screenplay' || member.job === 'Writer' || member.job === 'Story'
        );
        setCrew([...directors, ...writers.slice(0, 3)]);
      }

      if (recommendationsData) {
        setSimilarMovies(recommendationsData.results.slice(0, 10));
      }

      if (videosData) {
        const trailer = videosData.results.find(
          video => video.site === 'YouTube' && 
          (video.type === 'Trailer' || video.type === 'Teaser')
        );
        setTrailerKey(trailer?.key || null);
      }
    } catch (error) {
      setError('Failed to load movie information. Please try again later.');
      console.error('Error fetching movie data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      if (watchlist) {
        const watchlistItems = JSON.parse(watchlist);
        setIsInWatchlist(watchlistItems.includes(Number(movieId)));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      let watchlistArray = watchlist ? JSON.parse(watchlist) : [];

      if (isInWatchlist) {
        watchlistArray = watchlistArray.filter((id: number) => id !== Number(movieId));
      } else {
        watchlistArray.push(Number(movieId));
      }

      await AsyncStorage.setItem('watchlist', JSON.stringify(watchlistArray));
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  useEffect(() => {
    fetchData();
    checkWatchlist();
  }, [movieId]);

  const refreshData = async () => {
    await fetchData();
    await checkWatchlist();
  };

  return {
    movie,
    cast,
    crew,
    similarMovies,
    trailerKey,
    loading,
    error,
    isInWatchlist,
    toggleWatchlist,
    refreshData,
  };
};

export default useMovieData; 