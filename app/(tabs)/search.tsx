import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, X } from 'lucide-react-native';
import axios from 'axios';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  genre_ids: number[];
}

interface Genre {
  id: number;
  name: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [discoverResults, setDiscoverResults] = useState<Movie[]>([]);
  const [filteredResults, setFilteredResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary filter states (used in the modal)
  const [tempSelectedGenres, setTempSelectedGenres] = useState<number[]>([]);
  const [tempMinRating, setTempMinRating] = useState(0);
  
  // Active filter states (applied to results)
  const [activeGenres, setActiveGenres] = useState<number[]>([]);
  const [activeMinRating, setActiveMinRating] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    fetchGenres();
    fetchDiscoverMovies();
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      applyFiltersToSearchResults();
    } else {
      applyFiltersToDiscoverResults();
    }
  }, [searchResults, discoverResults, activeGenres, activeMinRating, query]);

  const fetchGenres = async () => {
    try {
      const response = await axios.get(
        'https://api.themoviedb.org/3/genre/movie/list',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
          },
        }
      );
      setGenres(response.data.genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchDiscoverMovies = async (genreId?: number, minRating?: number) => {
    setIsLoading(true);
    try {
      const params: any = {
        api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
        sort_by: 'popularity.desc',
      };
      
      if (genreId) {
        params.with_genres = genreId;
      }
      
      if (minRating) {
        params.vote_average_gte = minRating;
      }
      
      const response = await axios.get(
        'https://api.themoviedb.org/3/discover/movie',
        { params }
      );
      setDiscoverResults(response.data.results);
    } catch (error) {
      console.error('Error fetching discover movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchMovies = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      setIsLoading(true);
      try {
        const response = await axios.get(
          'https://api.themoviedb.org/3/search/movie',
          {
            params: {
              api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
              query: text,
            },
          }
        );
        setSearchResults(response.data.results);
      } catch (error) {
        console.error('Error searching movies:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const applyFiltersToSearchResults = () => {
    let filtered = [...searchResults];
    
    // Apply genre filter
    if (activeGenres.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genre_ids && movie.genre_ids.some(id => activeGenres.includes(id))
      );
    }
    
    // Apply rating filter
    if (activeMinRating > 0) {
      filtered = filtered.filter(movie => movie.vote_average >= activeMinRating);
    }
    
    setFilteredResults(filtered);
  };
  
  const applyFiltersToDiscoverResults = () => {
    let filtered = [...discoverResults];
    
    // Apply genre filter
    if (activeGenres.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genre_ids && movie.genre_ids.some(id => activeGenres.includes(id))
      );
    }
    
    // Apply rating filter
    if (activeMinRating > 0) {
      filtered = filtered.filter(movie => movie.vote_average >= activeMinRating);
    }
    
    setFilteredResults(filtered);
  };

  const toggleGenre = (genreId: number) => {
    if (tempSelectedGenres.includes(genreId)) {
      setTempSelectedGenres(tempSelectedGenres.filter(id => id !== genreId));
    } else {
      setTempSelectedGenres([...tempSelectedGenres, genreId]);
    }
  };

  const setRatingFilter = (rating: number) => {
    setTempMinRating(rating);
  };

  const clearTempFilters = () => {
    setTempSelectedGenres([]);
    setTempMinRating(0);
  };
  
  const clearActiveFilters = () => {
    setActiveGenres([]);
    setActiveMinRating(0);
  };
  
  const openFilterModal = () => {
    // Initialize temp filters with current active filters
    setTempSelectedGenres([...activeGenres]);
    setTempMinRating(activeMinRating);
    setFilterModalVisible(true);
  };
  
  const applyFiltersAndCloseModal = () => {
    // Set active filters from temp filters
    setActiveGenres(tempSelectedGenres);
    setActiveMinRating(tempMinRating);
    setFilterModalVisible(false);
    
    // If there are filters selected but no search query, fetch discover results with filters directly from API
    if ((tempSelectedGenres.length > 0 || tempMinRating > 0) && query.length <= 2) {
      const mainGenre = tempSelectedGenres.length > 0 ? tempSelectedGenres[0] : undefined;
      fetchDiscoverMovies(mainGenre, tempMinRating > 0 ? tempMinRating : undefined);
    }
  };
  
  const removeGenreFilter = (genreId: number) => {
    setActiveGenres(activeGenres.filter(id => id !== genreId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies or browse by filter..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={searchMovies}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={openFilterModal}
        >
          <Filter 
            size={20} 
            color={activeGenres.length > 0 || activeMinRating > 0 ? "#E50914" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      {(activeGenres.length > 0 || activeMinRating > 0) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {activeGenres.map(genreId => {
              const genre = genres.find(g => g.id === genreId);
              return genre ? (
                <View key={genreId} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{genre.name}</Text>
                  <TouchableOpacity onPress={() => removeGenreFilter(genreId)}>
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
            {activeMinRating > 0 && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>Rating ≥ {activeMinRating}</Text>
                <TouchableOpacity onPress={() => setActiveMinRating(0)}>
                  <X size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity onPress={clearActiveFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => router.push(`/movie/${item.id}`)}>
              <Image
                source={{
                  uri: item.poster_path 
                    ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                    : 'https://via.placeholder.com/200x300?text=No+Image',
                }}
                style={styles.resultPoster}
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultRating}>⭐ {item.vote_average.toFixed(1)}</Text>
                <View style={styles.genreContainer}>
                  {item.genre_ids?.slice(0, 3).map(genreId => {
                    const genre = genres.find(g => g.id === genreId);
                    return genre ? (
                      <View key={genreId} style={styles.genreTag}>
                        <Text style={styles.genreText}>{genre.name}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {query.length > 2 
                  ? (searchResults.length === 0 
                    ? "No movies found for your search" 
                    : "No movies match your filters")
                  : "Try searching for a movie or use filters to browse"}
              </Text>
              {query.length <= 2 && (
                <View style={styles.suggestedGenresContainer}>
                  <Text style={styles.suggestedGenresTitle}>Suggested genres:</Text>
                  <View style={styles.suggestedGenresGrid}>
                    {genres.slice(0, 8).map(genre => (
                      <TouchableOpacity
                        key={genre.id}
                        style={styles.suggestedGenre}
                        onPress={() => {
                          setActiveGenres([genre.id]);
                          fetchDiscoverMovies(genre.id);
                        }}
                      >
                        <Text style={styles.suggestedGenreText}>{genre.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Movies</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterSectionTitle}>Genres</Text>
              <View style={styles.genresGrid}>
                {genres.map(genre => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.genreOption,
                      tempSelectedGenres.includes(genre.id) && styles.genreOptionSelected
                    ]}
                    onPress={() => toggleGenre(genre.id)}
                  >
                    <Text 
                      style={[
                        styles.genreOptionText,
                        tempSelectedGenres.includes(genre.id) && styles.genreOptionTextSelected
                      ]}
                    >
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingsRow}>
                {[0, 5, 6, 7, 8, 9].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingOption,
                      tempMinRating === rating && styles.ratingOptionSelected
                    ]}
                    onPress={() => setRatingFilter(rating)}
                  >
                    <Text 
                      style={[
                        styles.ratingOptionText,
                        tempMinRating === rating && styles.ratingOptionTextSelected
                      ]}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearTempFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={applyFiltersAndCloseModal}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
    padding: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#1F1D2B',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeFiltersLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
  },
  filtersScroll: {
    flex: 1,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2B43',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginRight: 6,
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
  },
  clearFiltersText: {
    color: '#E50914',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#2D2B43',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#9E9E9E',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestedGenresContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  suggestedGenresTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedGenresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestedGenre: {
    backgroundColor: '#1F1D2B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  suggestedGenreText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F1D2B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  genreOption: {
    backgroundColor: '#2D2B43',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  genreOptionSelected: {
    backgroundColor: '#E50914',
  },
  genreOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  genreOptionTextSelected: {
    fontWeight: 'bold',
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratingOption: {
    backgroundColor: '#2D2B43',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  ratingOptionSelected: {
    backgroundColor: '#E50914',
  },
  ratingOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  ratingOptionTextSelected: {
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2D2B43',
    padding: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  clearButtonText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#E50914',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});