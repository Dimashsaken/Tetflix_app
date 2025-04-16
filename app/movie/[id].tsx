import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, FlatList, Dimensions, Pressable, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Heart, ChevronLeft, Star, Calendar, Clock, Film, AlertCircle, ExternalLink } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function MovieScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [similarMovies, setSimilarMovies] = useState<RelatedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMovieDetails();
    fetchCredits();
    fetchSimilarMovies();
    checkWatchlist();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
          },
        }
      );
      setMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setError('Failed to load movie information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}/credits`,
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
          },
        }
      );
      setCast(response.data.cast.slice(0, 10));
      // Get director, writers, and other key crew
      const directors = response.data.crew.filter((member: CrewMember) => member.job === 'Director');
      const writers = response.data.crew.filter((member: CrewMember) => 
        member.job === 'Screenplay' || member.job === 'Writer' || member.job === 'Story'
      );
      setCrew([...directors, ...writers.slice(0, 3)]);
    } catch (error) {
      console.error('Error fetching movie credits:', error);
    }
  };

  const fetchSimilarMovies = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}/recommendations`,
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
          },
        }
      );
      setSimilarMovies(response.data.results.slice(0, 10));
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    }
  };

  const checkWatchlist = async () => {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      if (watchlist) {
        const watchlistItems = JSON.parse(watchlist);
        setIsInWatchlist(watchlistItems.includes(Number(id)));
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
        watchlistArray = watchlistArray.filter((movieId: number) => movieId !== Number(id));
      } else {
        watchlistArray.push(Number(id));
      }

      await AsyncStorage.setItem('watchlist', JSON.stringify(watchlistArray));
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderCastItem = useCallback(({ item }: { item: CastMember }) => (
    <View style={styles.castCard}>
      <Image
        source={{
          uri: item.profile_path
            ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
            : 'https://via.placeholder.com/185x278?text=No+Image',
        }}
        style={styles.castImage}
      />
      <Text style={styles.castName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.characterName} numberOfLines={1}>
        {item.character}
      </Text>
    </View>
  ), []);

  const renderSimilarMovieItem = useCallback(({ item }: { item: RelatedMovie }) => (
    <TouchableOpacity 
      style={styles.similarMovieCard}
      onPress={() => {
        router.push(`/movie/${item.id}`);
      }}
    >
      <Image
        source={{
          uri: item.poster_path
            ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
            : 'https://via.placeholder.com/185x278?text=No+Image',
        }}
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
  ), [router]);

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonBackdrop} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonHeader}>
          <View>
            <View style={[styles.skeletonText, { width: SCREEN_WIDTH * 0.6, height: 28, marginBottom: 12 }]} />
            <View style={[styles.skeletonText, { width: 80, height: 20, marginBottom: 16 }]} />
          </View>
          <View style={styles.skeletonButton} />
        </View>
        
        <View style={styles.skeletonGenresContainer}>
          <View style={styles.skeletonGenre} />
          <View style={styles.skeletonGenre} />
          <View style={styles.skeletonGenre} />
        </View>
        
        <View style={[styles.skeletonText, { width: 150, height: 16, marginTop: 16, marginBottom: 24 }]} />
        
        <View style={[styles.skeletonText, { width: '100%', height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonText, { width: '100%', height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonText, { width: '100%', height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonText, { width: '80%', height: 16, marginBottom: 24 }]} />
        
        <View style={[styles.skeletonText, { width: 120, height: 20, marginBottom: 16 }]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.skeletonCastCard}>
                <View style={styles.skeletonCastImage} />
                <View style={[styles.skeletonText, { width: 80, height: 14, marginTop: 8 }]} />
                <View style={[styles.skeletonText, { width: 60, height: 12, marginTop: 4 }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <AlertCircle size={64} color="#E50914" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={fetchMovieDetails}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {renderLoadingSkeleton()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {renderErrorView()}
      </SafeAreaView>
    );
  }

  if (!movie) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Backdrop and gradient overlay */}
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri: movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                : `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
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
                uri: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                  : 'https://via.placeholder.com/342x513?text=No+Image',
              }}
              style={styles.poster}
            />
          </View>
        </View>

        {/* Back button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header with title and watchlist button */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{movie.title}</Text>
              {movie.tagline && (
                <Text style={styles.tagline}>"{movie.tagline}"</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.watchlistButton,
                isInWatchlist && styles.watchlistButtonActive,
              ]}
              onPress={toggleWatchlist}>
              <Heart
                size={24}
                color="#FFFFFF"
                fill={isInWatchlist ? '#E50914' : 'none'}
              />
            </TouchableOpacity>
          </View>

          {/* Movie metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Star size={18} color="#FFC107" fill="#FFC107" />
              <Text style={styles.metadataText}>
                {movie.vote_average.toFixed(1)} / 10
              </Text>
            </View>
            {movie.release_date && (
              <View style={styles.metadataItem}>
                <Calendar size={18} color="#FFFFFF" />
                <Text style={styles.metadataText}>
                  {new Date(movie.release_date).getFullYear()}
                </Text>
              </View>
            )}
            {movie.runtime && (
              <View style={styles.metadataItem}>
                <Clock size={18} color="#FFFFFF" />
                <Text style={styles.metadataText}>
                  {formatRuntime(movie.runtime)}
                </Text>
              </View>
            )}
          </View>

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
          {cast.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <FlatList
                data={cast}
                renderItem={renderCastItem}
                keyExtractor={(item) => `cast-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              />
            </View>
          )}

          {/* Crew - Directors and Writers */}
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

          {/* Production Companies */}
          {movie.production_companies && movie.production_companies.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Production</Text>
              <View style={styles.companyContainer}>
                {movie.production_companies.map((company) => (
                  <View key={company.id} style={styles.companyItem}>
                    {company.logo_path ? (
                      <Image
                        source={{
                          uri: `https://image.tmdb.org/t/p/w200${company.logo_path}`,
                        }}
                        style={styles.companyLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.companyName}>{company.name}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Similar Movies */}
          {similarMovies.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>You May Also Like</Text>
              <FlatList
                data={similarMovies}
                renderItem={renderSimilarMovieItem}
                keyExtractor={(item) => `similar-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarMoviesList}
              />
            </View>
          )}
          
          {/* External links - Would replace with actual data */}
          <View style={styles.externalLinksContainer}>
            <Pressable style={styles.externalLinkButton}>
              <Film size={20} color="#FFFFFF" />
              <Text style={styles.externalLinkText}>Watch Trailer</Text>
            </Pressable>
            <Pressable style={styles.externalLinkButton}>
              <ExternalLink size={20} color="#FFFFFF" />
              <Text style={styles.externalLinkText}>IMDB</Text>
            </Pressable>
          </View>

          {/* Footer space */}
          <View style={{ height: 40 }} />
        </View>
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
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 130,
    marginBottom: 10,
    paddingTop: 5,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    marginLeft: 130,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metadataText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
  watchlistButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 29, 43, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    borderColor: '#E50914',
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
  castList: {
    paddingVertical: 8,
  },
  castCard: {
    width: 100,
    marginRight: 12,
  },
  castImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2D2B43',
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  characterName: {
    color: '#9CA3AF',
    fontSize: 12,
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
  companyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  companyItem: {
    marginRight: 16,
    marginBottom: 16,
    maxWidth: 100,
  },
  companyLogo: {
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 14,
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
  externalLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Skeleton loading styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonBackdrop: {
    width: '100%',
    height: 300,
    backgroundColor: '#2D2B43',
  },
  skeletonContent: {
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#13111C',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 60,
  },
  skeletonText: {
    backgroundColor: '#2D2B43',
    borderRadius: 4,
  },
  skeletonButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D2B43',
  },
  skeletonGenresContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  skeletonGenre: {
    width: 80,
    height: 30,
    borderRadius: 16,
    backgroundColor: '#2D2B43',
    marginRight: 8,
  },
  skeletonCastCard: {
    width: 100,
    marginRight: 12,
  },
  skeletonCastImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2D2B43',
  },
  // Error view styles
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
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});