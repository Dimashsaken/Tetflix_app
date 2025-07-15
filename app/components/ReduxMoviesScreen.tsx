import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchPopularMovies, 
  fetchTopRatedMovies, 
  fetchTrendingMovies,
  selectPopularMovies,
  selectTopRatedMovies,
  selectTrendingMovies
} from '../../store/slices/moviesSlice';
import { 
  useGetPopularMoviesQuery,
  useGetTopRatedMoviesQuery,
  useGetTrendingMoviesQuery
} from '../../store/api/movieApi';
import { 
  selectWatchlistMovieIds,
  addToWatchlist,
  removeFromWatchlist
} from '../../store/slices/watchlistSlice';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';

const ReduxMoviesScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Using Redux state with async thunks
  const popularMovies = useAppSelector(selectPopularMovies);
  const topRatedMovies = useAppSelector(selectTopRatedMovies);
  const trendingMovies = useAppSelector(selectTrendingMovies);
  const watchlistIds = useAppSelector(selectWatchlistMovieIds);
  
  // Using RTK Query (alternative approach)
  const { 
    data: popularMoviesRTK,
    isLoading: popularLoading,
    error: popularError,
    refetch: refetchPopular
  } = useGetPopularMoviesQuery(1);
  
  const { 
    data: topRatedMoviesRTK,
    isLoading: topRatedLoading,
    error: topRatedError
  } = useGetTopRatedMoviesQuery(1);
  
  const { 
    data: trendingMoviesRTK,
    isLoading: trendingLoading,
    error: trendingError
  } = useGetTrendingMoviesQuery(1);
  
  // Initialize data on component mount
  useEffect(() => {
    // Using Redux async thunks
    dispatch(fetchPopularMovies(1));
    dispatch(fetchTopRatedMovies(1));
    dispatch(fetchTrendingMovies(1));
  }, [dispatch]);
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async (movie: any) => {
    try {
      if (watchlistIds.includes(movie.id)) {
        await dispatch(removeFromWatchlist(movie.id)).unwrap();
        dispatch(showSuccessToast(`${movie.title} removed from watchlist`));
      } else {
        await dispatch(addToWatchlist({ movie })).unwrap();
        dispatch(showSuccessToast(`${movie.title} added to watchlist`));
      }
    } catch (error) {
      dispatch(showErrorToast('Failed to update watchlist'));
    }
  };
  
  // Handle load more for popular movies
  const handleLoadMorePopular = () => {
    const nextPage = popularMovies.page + 1;
    if (nextPage <= popularMovies.totalPages && !popularMovies.isLoading) {
      dispatch(fetchPopularMovies(nextPage));
    }
  };
  
  // Simple movie card component
  const MovieCard = ({ movie, isInWatchlist, onWatchlistToggle }: any) => (
    <View style={styles.movieCard}>
      <Image
        source={{
          uri: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
            : 'https://via.placeholder.com/200x300?text=No+Image',
        }}
        style={styles.moviePoster}
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.movieRating}>⭐ {movie.vote_average?.toFixed(1) || 'N/A'}</Text>
        <TouchableOpacity
          style={[styles.watchlistButton, isInWatchlist && styles.watchlistButtonActive]}
          onPress={onWatchlistToggle}
        >
          <Text style={styles.watchlistButtonText}>
            {isInWatchlist ? 'Remove' : 'Add to Watchlist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Error message component
  const ErrorMessage = ({ message, onRetry }: any) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Loading component
  const LoadingSpinner = ({ size = 'large' }: any) => (
    <View style={styles.loadingSpinner}>
      <ActivityIndicator size={size} color="#E50914" />
    </View>
  );
  
  // Render movie item
  const renderMovieItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/movie/${item.id}`)}>
      <MovieCard
        movie={item}
        isInWatchlist={watchlistIds.includes(item.id)}
        onWatchlistToggle={() => handleWatchlistToggle(item)}
      />
    </TouchableOpacity>
  );
  
  // Render section header
  const renderSectionHeader = (title: string, isLoading: boolean, onRefresh?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isLoading && <LoadingSpinner size="small" />}
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshButton}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      {/* Popular Movies Section - Using Redux State */}
      <View style={styles.section}>
        {renderSectionHeader('Popular Movies (Redux)', popularMovies.isLoading, () => dispatch(fetchPopularMovies(1)))}
        
        {popularMovies.error && (
          <ErrorMessage 
            message={popularMovies.error} 
            onRetry={() => dispatch(fetchPopularMovies(1))}
          />
        )}
        
        <FlatList
          data={popularMovies.movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => `popular-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          onEndReached={handleLoadMorePopular}
          onEndReachedThreshold={0.5}
        />
      </View>
      
      {/* Top Rated Movies Section - Using RTK Query */}
      <View style={styles.section}>
        {renderSectionHeader('Top Rated Movies (RTK Query)', topRatedLoading)}
        
        {topRatedError && (
          <ErrorMessage 
            message="Failed to load top rated movies" 
            onRetry={() => {}} // RTK Query handles retries automatically
          />
        )}
        
        <FlatList
          data={topRatedMoviesRTK?.results || []}
          renderItem={renderMovieItem}
          keyExtractor={(item) => `top-rated-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
      
      {/* Trending Movies Section - Using RTK Query */}
      <View style={styles.section}>
        {renderSectionHeader('Trending Movies (RTK Query)', trendingLoading)}
        
        {trendingError && (
          <ErrorMessage 
            message="Failed to load trending movies" 
            onRetry={() => {}} // RTK Query handles retries automatically
          />
        )}
        
        <FlatList
          data={trendingMoviesRTK?.results || []}
          renderItem={renderMovieItem}
          keyExtractor={(item) => `trending-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
      
      {/* Redux State Info */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>🚀 Redux State Info:</Text>
        <Text style={styles.debugText}>Watchlist Items: {watchlistIds.length}</Text>
        <Text style={styles.debugText}>Popular Movies: {popularMovies.movies.length}</Text>
        <Text style={styles.debugText}>Top Rated Movies: {topRatedMoviesRTK?.results?.length || 0}</Text>
        <Text style={styles.debugText}>Trending Movies: {trendingMoviesRTK?.results?.length || 0}</Text>
        <Text style={styles.debugText}>Popular Loading: {popularMovies.isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>RTK Query Loading: {topRatedLoading ? 'Yes' : 'No'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  movieCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: 200,
  },
  movieInfo: {
    padding: 8,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieRating: {
    fontSize: 12,
    color: '#FFC107',
    marginBottom: 8,
  },
  watchlistButton: {
    backgroundColor: '#E50914',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: '#666',
  },
  watchlistButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingSpinner: {
    padding: 16,
  },
  debugSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 4,
  },
});

export default ReduxMoviesScreen;
