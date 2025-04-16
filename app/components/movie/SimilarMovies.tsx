import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getImageUrl } from '../../config/api';

interface RelatedMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface SimilarMoviesProps {
  movies: RelatedMovie[];
}

const SimilarMovies = ({ movies }: SimilarMoviesProps) => {
  const router = useRouter();

  if (!movies.length) return null;

  const renderSimilarMovieItem = ({ item }: { item: RelatedMovie }) => (
    <TouchableOpacity 
      style={styles.similarMovieCard}
      onPress={() => router.push(`/movie/${item.id}`)}
    >
      <Image
        source={{ uri: getImageUrl(item.poster_path, 'w185') }}
        style={styles.similarMoviePoster}
      />
      <View style={styles.similarMovieRatingContainer}>
        <Star size={12} color="#FFC107" fill="#FFC107" />
        <Text style={styles.similarMovieRating}>
          {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
        </Text>
      </View>
      <Text style={styles.similarMovieTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>You May Also Like</Text>
      <FlatList
        data={movies}
        renderItem={renderSimilarMovieItem}
        keyExtractor={(item) => `similar-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.similarMoviesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  similarMoviesList: {
    paddingVertical: 8,
  },
  similarMovieCard: {
    width: 120,
    marginRight: 12,
  },
  similarMoviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#2D2B43',
  },
  similarMovieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  similarMovieRatingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  similarMovieRating: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },
});

export default SimilarMovies; 