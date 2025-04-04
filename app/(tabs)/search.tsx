import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import axios from 'axios';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const router = useRouter();

  const searchMovies = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        const response = await axios.get(
          'https://api.themoviedb.org/3/search/movie',
          {
            params: {
              api_key: '3265874a21b929c2ae3081be45901f8c', // Replace with your TMDB API key
              query: text,
            },
          }
        );
        setResults(response.data.results);
      } catch (error) {
        console.error('Error searching movies:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={searchMovies}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => router.push(`/movie/${item.id}`)}>
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w200${item.poster_path}`,
              }}
              style={styles.resultPoster}
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultRating}>⭐ {item.vote_average.toFixed(1)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultPoster: {
    width: 80,
    height: 120,
  },
  resultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultRating: {
    color: '#FFC107',
    fontSize: 14,
  },
});