import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

interface Movie {
  id?: number;
  title?: string;
  poster_path?: string;
  vote_average?: number;
  overview?: string;
}

export default function WatchlistScreen() {
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadWatchlist();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      const savedWatchlistIds = await AsyncStorage.getItem('watchlist');
      if (savedWatchlistIds) {
        // Parse the IDs from storage
        const ids: number[] = JSON.parse(savedWatchlistIds);
        
        // Filter out any undefined or null IDs
        const validIds = ids.filter((id): id is number => 
          id !== undefined && id !== null && typeof id === 'number'
        );
        
        setWatchlistIds(validIds);
        
        // Fetch details for all movies in the watchlist
        fetchWatchlistDetails(validIds);
      } else {
        setWatchlistIds([]);
        setWatchlistMovies([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setIsLoading(false);
    }
  };
  
  const fetchWatchlistDetails = async (ids: number[]) => {
    if (ids.length === 0) {
      setWatchlistMovies([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch details for each movie
      const moviePromises = ids.map(id => 
        axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77'
          }
        })
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching movie ${id}:`, error);
          return null;
        })
      );
      
      const moviesData = await Promise.all(moviePromises);
      // Filter out any null responses from failed requests
      const validMovies = moviesData.filter(movie => movie !== null);
      
      setWatchlistMovies(validMovies);
    } catch (error) {
      console.error('Error fetching watchlist details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchlist = async (movieId: number | undefined) => {
    if (movieId === undefined) {
      console.error('Cannot remove undefined movie ID from watchlist');
      return;
    }
    
    try {
      // Remove from watchlist IDs
      const updatedIds = watchlistIds.filter(id => id !== movieId);
      setWatchlistIds(updatedIds);
      
      // Remove from watchlist movies
      const updatedMovies = watchlistMovies.filter(movie => movie.id !== movieId);
      setWatchlistMovies(updatedMovies);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('watchlist', JSON.stringify(updatedIds));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {watchlistMovies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtext}>
            Add movies to your watchlist to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={watchlistMovies}
          keyExtractor={(item) => (item.id !== undefined ? item.id.toString() : Math.random().toString())}
          renderItem={({ item }) => (
            <View style={styles.movieItem}>
              <TouchableOpacity
                style={styles.movieContent}
                onPress={() => item.id !== undefined && router.push(`/movie/${item.id}`)}>
                <Image
                  source={{
                    uri: item.poster_path 
                      ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                      : 'https://via.placeholder.com/200x300?text=No+Image',
                  }}
                  style={styles.poster}
                />
                <View style={styles.movieInfo}>
                  <Text style={styles.title}>{item.title || 'Untitled'}</Text>
                  <Text style={styles.rating}>⭐ {(item.vote_average || 0).toFixed(1)}</Text>
                  {item.overview && (
                    <Text style={styles.overview} numberOfLines={2}>
                      {item.overview}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => item.id !== undefined && removeFromWatchlist(item.id)}>
                <Trash2 size={20} color="#E21221" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  movieItem: {
    flexDirection: 'row',
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  movieContent: {
    flex: 1,
    flexDirection: 'row',
  },
  poster: {
    width: 80,
    height: 120,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rating: {
    color: '#FFC107',
    fontSize: 14,
    marginBottom: 4,
  },
  overview: {
    color: '#9E9E9E',
    fontSize: 12,
    lineHeight: 16,
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
  },
});