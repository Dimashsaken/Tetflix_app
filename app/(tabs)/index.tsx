import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  backdrop_path: string;
  release_date: string;
}

export default function MoviesScreen() {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [trendingPage, setTrendingPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState({
    popular: false,
    topRated: false,
    trending: false
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPopularMovies();
    fetchTopRatedMovies();
    fetchTrendingMovies();
  }, []);

  const fetchPopularMovies = async (page = 1) => {
    if (isLoadingMore.popular && page > 1) return;
    
    try {
      setIsLoadingMore({...isLoadingMore, popular: true});
      const response = await axios.get(
        'https://api.themoviedb.org/3/movie/popular',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
            page,
          },
        }
      );
      
      if (page === 1) {
        setPopularMovies(response.data.results);
      } else {
        setPopularMovies([...popularMovies, ...response.data.results]);
      }
      
      setPopularPage(page);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
    } finally {
      setIsLoadingMore({...isLoadingMore, popular: false});
    }
  };

  const fetchTopRatedMovies = async (page = 1) => {
    if (isLoadingMore.topRated && page > 1) return;
    
    try {
      setIsLoadingMore({...isLoadingMore, topRated: true});
      const response = await axios.get(
        'https://api.themoviedb.org/3/movie/top_rated',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
            page,
          },
        }
      );
      
      if (page === 1) {
        setTopRatedMovies(response.data.results);
      } else {
        setTopRatedMovies([...topRatedMovies, ...response.data.results]);
      }
      
      setTopRatedPage(page);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
    } finally {
      setIsLoadingMore({...isLoadingMore, topRated: false});
    }
  };

  const fetchTrendingMovies = async (page = 1) => {
    if (isLoadingMore.trending && page > 1) return;
    
    try {
      setIsLoadingMore({...isLoadingMore, trending: true});
      const response = await axios.get(
        'https://api.themoviedb.org/3/trending/movie/day',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
            page,
          },
        }
      );
      
      if (page === 1) {
        setTrendingMovies(response.data.results);
      } else {
        setTrendingMovies([...trendingMovies, ...response.data.results]);
      }
      
      setTrendingPage(page);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    } finally {
      setIsLoadingMore({...isLoadingMore, trending: false});
    }
  };

  const loadMorePopular = () => {
    if (!isLoadingMore.popular) {
      fetchPopularMovies(popularPage + 1);
    }
  };

  const loadMoreTopRated = () => {
    if (!isLoadingMore.topRated) {
      fetchTopRatedMovies(topRatedPage + 1);
    }
  };

  const loadMoreTrending = () => {
    if (!isLoadingMore.trending) {
      fetchTrendingMovies(trendingPage + 1);
    }
  };

  const renderFooter = (section: 'popular' | 'topRated' | 'trending') => {
    if (!isLoadingMore[section]) return null;
    
    return (
      <View style={[
        styles.loaderContainer, 
        section !== 'popular' && styles.horizontalLoaderContainer
      ]}>
        <ActivityIndicator size="small" color="#E50914" />
      </View>
    );
  };

  const renderPopularMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.popularMovieCard}
      onPress={() => router.push(`/movie/${item.id}`)}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        }}
        style={styles.popularPoster}
      />
      <View style={styles.movieInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.trendingMovieCard}
      onPress={() => router.push(`/movie/${item.id}`)}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w780${item.backdrop_path}`,
        }}
        style={styles.trendingPoster}
      />
      <View style={styles.trendingOverlay}>
        <Text style={styles.trendingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trendingRating}>⭐ {item.vote_average.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTopRatedMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.topRatedMovieCard}
      onPress={() => router.push(`/movie/${item.id}`)}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        }}
        style={styles.topRatedPoster}
      />
      <View style={styles.topRatedInfo}>
        <Text style={styles.topRatedTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.topRatedYear}>
          {item.release_date ? item.release_date.substring(0, 4) : ''}
        </Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleMainScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // Adjust this value as needed
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
      
    if (isCloseToBottom && !isLoadingMore.popular) {
      loadMorePopular();
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      ref={scrollViewRef}
      onScroll={handleMainScroll}
      scrollEventThrottle={400} // Adjust this value as needed
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <Text style={styles.sectionHint}>Swipe for more →</Text>
        </View>
        <FlatList
          data={trendingMovies}
          renderItem={renderTrendingMovie}
          keyExtractor={(item) => `trending-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          onEndReached={loadMoreTrending}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => renderFooter('trending')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Rated</Text>
          <Text style={styles.sectionHint}>Swipe for more →</Text>
        </View>
        <FlatList
          data={topRatedMovies}
          renderItem={renderTopRatedMovie}
          keyExtractor={(item) => `top-rated-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          onEndReached={loadMoreTopRated}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => renderFooter('topRated')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular</Text>
        <FlatList
          data={popularMovies}
          renderItem={renderPopularMovie}
          keyExtractor={(item) => `popular-${item.id}`}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.gridList}
          ListFooterComponent={() => renderFooter('popular')}
        />
      </View>
      {isLoadingMore.popular && (
        <View style={styles.mainLoaderContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      )}
    </ScrollView>
  );
}

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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionHint: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  gridList: {
    paddingHorizontal: 8,
  },
  loaderContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center', 
    alignItems: 'center'
  },
  horizontalLoaderContainer: {
    width: 60, // This gives space for the loading indicator at the end of horizontal lists
  },
  mainLoaderContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  
  // Popular movies (grid layout)
  popularMovieCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: '47%',
  },
  popularPoster: {
    width: '100%',
    height: 200,
  },
  movieInfo: {
    padding: 12,
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
  
  // Trending movies (horizontal cards with backdrop)
  trendingMovieCard: {
    width: 280,
    height: 160,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingPoster: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  trendingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trendingRating: {
    color: '#FFC107',
    fontSize: 14,
    marginTop: 4,
  },
  
  // Top rated movies (horizontal list with badges)
  topRatedMovieCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  topRatedPoster: {
    width: '100%',
    height: 200,
  },
  topRatedInfo: {
    padding: 12,
    height: 100,
  },
  topRatedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  topRatedYear: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 8,
  },
  ratingBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});