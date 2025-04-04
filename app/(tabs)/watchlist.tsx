import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trash2 } from 'lucide-react-native';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const savedWatchlist = await AsyncStorage.getItem('watchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const removeFromWatchlist = async (movieId: number) => {
    try {
      const updatedWatchlist = watchlist.filter((movie) => movie.id !== movieId);
      await AsyncStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  return (
    <View style={styles.container}>
      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtext}>
            Add movies to your watchlist to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.movieItem}>
              <TouchableOpacity
                style={styles.movieContent}
                onPress={() => router.push(`/movie/${item.id}`)}>
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w200${item.poster_path}`,
                  }}
                  style={styles.poster}
                />
                <View style={styles.movieInfo}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWatchlist(item.id)}>
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
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
  },
});