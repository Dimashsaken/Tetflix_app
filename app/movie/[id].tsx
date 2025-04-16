import React from 'react';
import { View, StyleSheet, Image, ScrollView, SafeAreaView, RefreshControl, StatusBar, Pressable, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Film, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useMovieData from '../hooks/useMovieData';
import { getImageUrl } from '../config/api';
import MovieHeader from '../components/movie/MovieHeader';
import MovieMetadata from '../components/movie/MovieMetadata';
import MovieCast from '../components/movie/MovieCast';
import SimilarMovies from '../components/movie/SimilarMovies';

export default function MovieScreen() {
  const { id } = useLocalSearchParams();
  const {
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
  } = useMovieData(id as string);

  const handleTrailerPress = async () => {
    if (trailerKey) {
      const url = `https://www.youtube.com/watch?v=${trailerKey}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    }
  };

  const handleIMDBPress = async () => {
    if (movie?.imdb_id) {
      const url = `https://www.imdb.com/title/${movie.imdb_id}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Backdrop and gradient overlay */}
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri: movie?.backdrop_path
                ? getImageUrl(movie.backdrop_path, 'w780')
                : getImageUrl(movie?.poster_path || null, 'w500'),
            }}
            style={styles.backdrop}
          />
          <LinearGradient
            colors={['transparent', 'rgba(19, 17, 28, 0.8)', '#13111C']}
            style={styles.backdropGradient}
          />
          <View style={styles.posterContainer}>
            <Image
              source={{
                uri: getImageUrl(movie?.poster_path || null, 'w342'),
              }}
              style={styles.poster}
            />
          </View>
        </View>

        {movie && (
          <>
            <MovieHeader
              title={movie.title}
              tagline={movie.tagline}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={toggleWatchlist}
            />

            <View style={styles.content}>
              <MovieMetadata
                voteAverage={movie.vote_average}
                releaseDate={movie.release_date}
                runtime={movie.runtime}
              />

              {/* Genres */}
              <View style={styles.genreContainer}>
                {movie.genres.map((genre) => (
                  <View key={genre.id} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>

              {/* Overview */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Synopsis</Text>
                <Text style={styles.overview}>{movie.overview}</Text>
              </View>

              {/* Cast */}
              <MovieCast cast={cast} />

              {/* Crew */}
              {crew.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Crew</Text>
                  {crew.map((member) => (
                    <View key={`${member.id}-${member.job}`} style={styles.crewItem}>
                      <Text style={styles.crewName}>{member.name}</Text>
                      <Text style={styles.crewRole}>{member.job}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Similar Movies */}
              <SimilarMovies movies={similarMovies} />

              {/* External links */}
              <View style={styles.externalLinksContainer}>
                <Pressable 
                  style={[styles.externalLinkButton, !trailerKey && styles.disabledButton]}
                  onPress={handleTrailerPress}
                  disabled={!trailerKey}
                >
                  <Film size={20} color="#FFFFFF" />
                  <Text style={styles.externalLinkText}>Watch Trailer</Text>
                </Pressable>
                <Pressable 
                  style={[styles.externalLinkButton, !movie.imdb_id && styles.disabledButton]}
                  onPress={handleIMDBPress}
                  disabled={!movie.imdb_id}
                >
                  <ExternalLink size={20} color="#FFFFFF" />
                  <Text style={styles.externalLinkText}>IMDB</Text>
                </Pressable>
              </View>

              {/* Footer space */}
              <View style={{ height: 40 }} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
  },
  scrollContainer: {
    flex: 1,
  },
  backdropContainer: {
    position: 'relative',
    height: 300,
  },
  backdrop: {
    width: '100%',
    height: 300,
  },
  backdropGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  posterContainer: {
    position: 'absolute',
    bottom: -130,
    left: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    borderRadius: 12,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  genreTag: {
    backgroundColor: 'rgba(31, 29, 43, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  overview: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
  },
  crewItem: {
    marginBottom: 12,
  },
  crewName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  crewRole: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  externalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  externalLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});