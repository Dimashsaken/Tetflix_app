import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
}

export default function MovieScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMovieDetails();
    checkWatchlist();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77', // Replace with your TMDB API key
          },
        }
      );
      setMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const checkWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      if (watchlist) {
        const movies = JSON.parse(watchlist);
        setIsInWatchlist(movies.some((m: MovieDetails) => m.id === Number(id)));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      let movies = watchlist ? JSON.parse(watchlist) : [];

      if (isInWatchlist) {
        movies = movies.filter((m: MovieDetails) => m.id !== Number(id));
      } else if (movie) {
        movies.push({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average
        });
      }

      await AsyncStorage.setItem('watchlist', JSON.stringify(movies));
      setIsInWatchlist(!isInWatchlist);
      
      // Remove page reload to avoid white flash
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
        }}
        style={styles.backdrop}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.watchlistButton,
              isInWatchlist && styles.watchlistButtonActive,
            ]}
            onPress={toggleWatchlist}>
            <Heart
              size={24}
              color={isInWatchlist ? '#E21221' : '#FFFFFF'}
              fill={isInWatchlist ? '#E21221' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.genreContainer}>
          {movie.genres.map((genre) => (
            <View key={genre.id} style={styles.genreTag}>
              <Text style={styles.genreText}>{genre.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.releaseDate}>
          Released: {new Date(movie.release_date).toLocaleDateString()}
        </Text>

        <Text style={styles.overview}>{movie.overview}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
  },
  backdrop: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#13111C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    color: '#FFC107',
    fontSize: 16,
    marginBottom: 12,
  },
  watchlistButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1F1D2B',
  },
  watchlistButtonActive: {
    backgroundColor: '#2D2B3A',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  genreTag: {
    backgroundColor: '#1F1D2B',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  releaseDate: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  overview: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  loading: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
  },
});