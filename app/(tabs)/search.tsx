import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, X, Clock, Trash2, TrendingUp, LayoutGrid, List, ArrowUpDown, Heart } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { useFocusEffect } from '@react-navigation/native';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // New states for search improvements
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  
  // Sorting options
  const [sortOption, setSortOption] = useState('popularity.desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // View mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Temporary filter states (used in the modal)
  const [tempSelectedGenres, setTempSelectedGenres] = useState<number[]>([]);
  const [tempMinRating, setTempMinRating] = useState(0);
  const [tempYearRange, setTempYearRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  
  // Year picker modal states
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [yearPickerType, setYearPickerType] = useState<'start' | 'end'>('start');
  const [selectedYear, setSelectedYear] = useState(2000);
  
  // Active filter states (applied to results)
  const [activeGenres, setActiveGenres] = useState<number[]>([]);
  const [activeMinRating, setActiveMinRating] = useState(0);
  const [activeYearRange, setActiveYearRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  
  // Rename favorites to watchlist
  const [watchlist, setWatchlist] = useState<number[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    fetchGenres();
    fetchDiscoverMovies(undefined, undefined, 1);
    fetchTrendingMovies();
    loadSearchHistory();
    loadUserPreferences();
    loadWatchlist();
  }, []);

  // Add useFocusEffect to reload watchlist when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  useEffect(() => {
    if (query.length > 2) {
      applyFiltersToSearchResults();
    } else {
      applyFiltersToDiscoverResults();
    }
  }, [searchResults, discoverResults, activeGenres, activeMinRating, query]);

  // When sort option changes, refresh the results
  useEffect(() => {
    if (query.length <= 2) {
      fetchDiscoverMovies(
        activeGenres.length > 0 ? activeGenres[0] : undefined,
        activeMinRating > 0 ? activeMinRating : undefined,
        1
      );
    }
  }, [sortOption]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchToHistory = async (searchTerm: string) => {
    if (searchTerm.trim().length < 3) return;
    
    try {
      // Remove the term if it already exists and add it to the beginning
      const updatedHistory = [
        searchTerm,
        ...searchHistory.filter(item => item !== searchTerm)
      ].slice(0, 10); // Limit to 10 items
      
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      const response = await axios.get(
        'https://api.themoviedb.org/3/trending/movie/day',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
          },
        }
      );
      setTrendingMovies(response.data.results.slice(0, 10));
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

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

  const fetchDiscoverMovies = async (genreId?: number, minRating?: number, page = 1) => {
    if (isLoadingMore && page > 1) return;
    
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const params: any = {
        api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
        sort_by: sortOption,
        page,
      };
      
      if (genreId) {
        params.with_genres = genreId;
      }
      
      if (minRating) {
        params.vote_average_gte = minRating;
      }
      
      // Add release date range filter
      if (activeYearRange[0] > 2000 || activeYearRange[1] < new Date().getFullYear()) {
        params.primary_release_date_gte = `${activeYearRange[0]}-01-01`;
        params.primary_release_date_lte = `${activeYearRange[1]}-12-31`;
      }
      
      const response = await axios.get(
        'https://api.themoviedb.org/3/discover/movie',
        { params }
      );
      
      if (page === 1) {
        setDiscoverResults(response.data.results);
      } else {
        setDiscoverResults([...discoverResults, ...response.data.results]);
      }
      
      setDiscoverPage(page);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching discover movies:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Debounced search function to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      if (text.length > 2) {
        performSearch(text, 1);
      } else {
        setSearchResults([]);
        setSearchPage(1);
      }
    }, 500),
    []
  );

  const handleSearchInput = (text: string) => {
    setQuery(text);
    setShowSearchHistory(text.length > 0 && text.length < 3);
    debouncedSearch(text);
  };

  const performSearch = async (text: string, page = 1) => {
    if (page === 1) {
      setIsLoading(true);
      setSearchResults([]);  // Clear results when starting a new search
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await axios.get(
        'https://api.themoviedb.org/3/search/movie',
        {
          params: {
            api_key: '3e3f0a46d6f2abc8e557d06b3fc21a77',
            query: text,
            page,
          },
        }
      );
      
      if (page === 1) {
        setSearchResults(response.data.results);
        // Save search to history when results are found
        if (response.data.results.length > 0) {
          saveSearchToHistory(text);
        }
      } else {
        setSearchResults([...searchResults, ...response.data.results]);
      }
      
      setSearchPage(page);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const searchMovies = (text: string, page = 1) => {
    setQuery(text);
    setShowSearchHistory(false);
    performSearch(text, page);
  };

  const loadMoreResults = () => {
    if (isLoadingMore) return;
    
    const nextPage = query.length > 2 ? searchPage + 1 : discoverPage + 1;
    const currentTotalPages = totalPages || 1;
    
    if (nextPage <= currentTotalPages) {
      if (query.length > 2) {
        searchMovies(query, nextPage);
      } else if (activeGenres.length > 0 || activeMinRating > 0) {
        const mainGenre = activeGenres.length > 0 ? activeGenres[0] : undefined;
        fetchDiscoverMovies(mainGenre, activeMinRating > 0 ? activeMinRating : undefined, nextPage);
      } else {
        fetchDiscoverMovies(undefined, undefined, nextPage);
      }
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
    
    // Apply year filter (if we had release_date in the movie objects)
    // This would need additional data from the API
    
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
    setTempYearRange([2000, new Date().getFullYear()]);
  };
  
  const clearActiveFilters = () => {
    setActiveGenres([]);
    setActiveMinRating(0);
    setActiveYearRange([2000, new Date().getFullYear()]);
  };
  
  const openFilterModal = () => {
    // Initialize temp filters with current active filters
    setTempSelectedGenres([...activeGenres]);
    setTempMinRating(activeMinRating);
    setTempYearRange([...activeYearRange]);
    setFilterModalVisible(true);
  };
  
  const applyFiltersAndCloseModal = () => {
    // Set active filters from temp filters
    setActiveGenres(tempSelectedGenres);
    setActiveMinRating(tempMinRating);
    setActiveYearRange(tempYearRange);
    setFilterModalVisible(false);
    
    // If there are filters selected but no search query, fetch discover results with filters directly from API
    if ((tempSelectedGenres.length > 0 || tempMinRating > 0 || 
        tempYearRange[0] > 1900 || tempYearRange[1] < new Date().getFullYear()) && 
        query.length <= 2) {
      const mainGenre = tempSelectedGenres.length > 0 ? tempSelectedGenres[0] : undefined;
      fetchDiscoverMovies(mainGenre, tempMinRating > 0 ? tempMinRating : undefined, 1);
    }
  };
  
  const removeGenreFilter = (genreId: number) => {
    setActiveGenres(activeGenres.filter(id => id !== genreId));
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  };

  // Render search history and trending suggestions
  const renderSearchSuggestions = () => {
    if (!showSearchHistory && query.length < 1) return null;
    
    return (
      <View style={styles.suggestionContainer}>
        {showSearchHistory && searchHistory.length > 0 && (
          <>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionTitleContainer}>
                <Clock size={16} color="#9E9E9E" />
                <Text style={styles.suggestionTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Trash2 size={16} color="#E50914" />
              </TouchableOpacity>
            </View>
            {searchHistory.map((item, index) => (
              <TouchableOpacity 
                key={`history-${index}`}
                style={styles.suggestionItem}
                onPress={() => searchMovies(item, 1)}
              >
                <Clock size={16} color="#9E9E9E" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        
        {query.length < 1 && trendingMovies.length > 0 && (
          <>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionTitleContainer}>
                <TrendingUp size={16} color="#9E9E9E" />
                <Text style={styles.suggestionTitle}>Trending Searches</Text>
              </View>
            </View>
            {trendingMovies.map((movie) => (
              <TouchableOpacity 
                key={`trending-${movie.id}`}
                style={styles.suggestionItem}
                onPress={() => {
                  setQuery(movie.title);
                  searchMovies(movie.title, 1);
                }}
              >
                <TrendingUp size={16} color="#9E9E9E" />
                <Text style={styles.suggestionText}>{movie.title}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    );
  };

  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const viewPref = await AsyncStorage.getItem('viewMode');
      if (viewPref) {
        setViewMode(viewPref as 'list' | 'grid');
      }

      const sortPref = await AsyncStorage.getItem('sortOption');
      if (sortPref) {
        setSortOption(sortPref);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Save view mode preference
  const saveViewMode = async (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      await AsyncStorage.setItem('viewMode', mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  // Save sort option preference
  const saveSortOption = async (option: string) => {
    setSortOption(option);
    try {
      await AsyncStorage.setItem('sortOption', option);
    } catch (error) {
      console.error('Error saving sort option:', error);
    }
  };

  // Add a new method to handle sorting
  const handleSortChange = (option: string) => {
    saveSortOption(option);
    setShowSortOptions(false);
  };

  // Helper function to handle year selection
  const openYearPicker = (type: 'start' | 'end') => {
    setYearPickerType(type);
    setSelectedYear(type === 'start' ? tempYearRange[0] : tempYearRange[1]);
    setYearPickerVisible(true);
  };

  const confirmYearSelection = () => {
    if (yearPickerType === 'start') {
      // Ensure start year is not greater than end year
      const endYear = Math.max(selectedYear, tempYearRange[1]);
      setTempYearRange([selectedYear, endYear]);
    } else {
      // Ensure end year is not less than start year
      const startYear = Math.min(selectedYear, tempYearRange[0]);
      setTempYearRange([startYear, selectedYear]);
    }
    setYearPickerVisible(false);
  };

  // Generate years for the picker
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  // Render sort options dropdown
  const renderSortOptions = () => {
    if (!showSortOptions) return null;
    
    const sortOptions = [
      { value: 'popularity.desc', label: 'Most Popular', icon: 'trending-up' },
      { value: 'popularity.asc', label: 'Least Popular', icon: 'trending-down' },
      { value: 'vote_average.desc', label: 'Highest Rating', icon: 'star' },
      { value: 'vote_average.asc', label: 'Lowest Rating', icon: 'star-half' },
      { value: 'release_date.desc', label: 'Newest First', icon: 'calendar-plus' },
      { value: 'release_date.asc', label: 'Oldest First', icon: 'calendar-minus' },
    ];
    
    return (
      <View style={styles.sortOptionsContainer}>
        {sortOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortOptionItem,
              sortOption === option.value && styles.sortOptionItemSelected
            ]}
            onPress={() => handleSortChange(option.value)}
          >
            <Text 
              style={[
                styles.sortOptionText,
                sortOption === option.value && styles.sortOptionTextSelected
              ]}
            >
              {option.label}
            </Text>
            {sortOption === option.value && (
              <View style={styles.sortOptionCheckmark}>
                <Text style={{ color: '#FFFFFF' }}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Load watchlist from storage
  const loadWatchlist = async () => {
    try {
      const list = await AsyncStorage.getItem('watchlist');
      if (list) {
        setWatchlist(JSON.parse(list));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  // Toggle watchlist status of a movie
  const toggleWatchlist = async (movieId: number | undefined) => {
    if (movieId === undefined) {
      console.error('Cannot add undefined movie ID to watchlist');
      return;
    }
    
    try {
      let newWatchlist;
      if (watchlist.includes(movieId)) {
        newWatchlist = watchlist.filter(id => id !== movieId);
      } else {
        newWatchlist = [...watchlist, movieId];
      }
      setWatchlist(newWatchlist);
      await AsyncStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    } catch (error) {
      console.error('Error saving to watchlist:', error);
    }
  };

  // Render the movie item based on the current view mode
  const renderMovieItem = ({ item }: { item: Movie }) => {
    if (!item || item.id === undefined) {
      return null; // Don't render items without valid IDs
    }
    
    const isInWatchlist = watchlist.includes(item.id);
    
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => item.id !== undefined && router.push(`/movie/${item.id}`)}>
          <Image
            source={{
              uri: item.poster_path 
                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                : 'https://via.placeholder.com/300x450?text=No+Image',
            }}
            style={styles.gridPoster}
          />
          <View style={styles.gridOverlay}>
            <TouchableOpacity 
              style={styles.watchlistButton}
              onPress={(e) => {
                e.stopPropagation();
                if (item.id !== undefined) {
                  toggleWatchlist(item.id);
                }
              }}
            >
              <Heart 
                size={20} 
                color="#FFFFFF"
                fill={isInWatchlist ? "#E50914" : "transparent"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.gridInfo}>
            <Text style={styles.gridTitle} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
            <Text style={styles.gridRating}>⭐ {(item.vote_average || 0).toFixed(1)}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => item.id !== undefined && router.push(`/movie/${item.id}`)}>
        <Image
          source={{
            uri: item.poster_path 
              ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
              : 'https://via.placeholder.com/200x300?text=No+Image',
          }}
          style={styles.resultPoster}
        />
        <View style={styles.resultInfo}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => item.id !== undefined && toggleWatchlist(item.id)}
                style={styles.actionButton}
              >
                <Heart 
                  size={18} 
                  color="#FFFFFF"
                  fill={isInWatchlist ? "#E50914" : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.resultRating}>⭐ {(item.vote_average || 0).toFixed(1)}</Text>
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
    );
  };

  // Render skeleton loader for results
  const renderSkeletonLoader = () => {
    const skeletonItems = viewMode === 'grid' ? 
      Array(6).fill(0).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.gridItem}>
          <View style={[styles.gridPoster, styles.skeletonImage]} />
          <View style={styles.gridInfo}>
            <View style={[styles.skeletonText, { width: '80%', height: 14, marginBottom: 4 }]} />
            <View style={[styles.skeletonText, { width: '40%', height: 12 }]} />
          </View>
        </View>
      )) : 
      Array(4).fill(0).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.resultItem}>
          <View style={[styles.resultPoster, styles.skeletonImage]} />
          <View style={styles.resultInfo}>
            <View style={[styles.skeletonText, { width: '70%', height: 16, marginBottom: 4 }]} />
            <View style={[styles.skeletonText, { width: '30%', height: 14, marginBottom: 8 }]} />
            <View style={styles.genreContainer}>
              <View style={[styles.skeletonTag, { width: 60 }]} />
              <View style={[styles.skeletonTag, { width: 80 }]} />
              <View style={[styles.skeletonTag, { width: 70 }]} />
            </View>
          </View>
        </View>
      ));

    return (
      <View style={viewMode === 'grid' ? styles.gridContainer : undefined}>
        {skeletonItems}
      </View>
    );
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
            onChangeText={handleSearchInput}
            onFocus={() => setShowSearchHistory(query.length > 0 && query.length < 3)}
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setQuery('');
                setSearchResults([]);
                setShowSearchHistory(false);
              }}
            >
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
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

      {renderSearchSuggestions()}

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

      {/* View controls (sort and layout toggle) */}
      <View style={styles.viewControlsContainer}>
        {/* Sort button */}
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <ArrowUpDown size={16} color="#FFFFFF" />
          <Text style={styles.sortButtonText}>
            {sortOption.includes('popularity') 
              ? 'Popularity' 
              : sortOption.includes('vote_average') 
                ? 'Rating' 
                : 'Release Date'}
          </Text>
        </TouchableOpacity>
        
        {/* Layout toggle */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleActive,
              { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
            ]}
            onPress={() => saveViewMode('list')}
          >
            <List size={18} color={viewMode === 'list' ? '#FFFFFF' : '#9E9E9E'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton,
              viewMode === 'grid' && styles.viewToggleActive,
              { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
            ]}
            onPress={() => saveViewMode('grid')}
          >
            <LayoutGrid size={18} color={viewMode === 'grid' ? '#FFFFFF' : '#9E9E9E'} />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderSortOptions()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {renderSkeletonLoader()}
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => (item.id !== undefined ? item.id.toString() : Math.random().toString())}
          renderItem={renderMovieItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when changing layouts
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : undefined}
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
                          fetchDiscoverMovies(genre.id, undefined, 1);
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
                    {tempSelectedGenres.includes(genre.id) && (
                      <View style={styles.genreSelectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingSliderContainer}>
                <View style={styles.ratingLabels}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                    <Text 
                      key={rating} 
                      style={[
                        styles.ratingLabel,
                        tempMinRating === rating && styles.ratingLabelActive
                      ]}
                    >
                      {rating}
                    </Text>
                  ))}
                </View>
                <View style={styles.ratingTrack}>
                  <View 
                    style={[
                      styles.ratingFill, 
                      { width: `${(tempMinRating / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <View style={styles.ratingTouchArea}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={styles.ratingTouchPoint}
                      onPress={() => setRatingFilter(rating)}
                    >
                      {tempMinRating === rating && (
                        <View style={styles.ratingActivePoint} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingDescription}>
                  {tempMinRating === 0 
                    ? 'Show all ratings' 
                    : `Show only movies rated ${tempMinRating} or higher`}
                </Text>
              </View>
              
              <Text style={styles.filterSectionTitle}>Release Year Range</Text>
              <View style={styles.yearRangeButtons}>
                <TouchableOpacity 
                  style={styles.yearButton}
                  onPress={() => openYearPicker('start')}
                >
                  <Text style={styles.yearButtonLabel}>From</Text>
                  <Text style={styles.yearButtonValue}>{tempYearRange[0]}</Text>
                </TouchableOpacity>
                
                <View style={styles.yearRangeSeparator}>
                  <Text style={styles.yearRangeSeparatorText}>to</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.yearButton}
                  onPress={() => openYearPicker('end')}
                >
                  <Text style={styles.yearButtonLabel}>To</Text>
                  <Text style={styles.yearButtonValue}>{tempYearRange[1]}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.resetYearButton}
                onPress={() => setTempYearRange([2000, new Date().getFullYear()])}
              >
                <Text style={styles.resetYearButtonText}>Reset to All Years</Text>
              </TouchableOpacity>
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

      {/* Year Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={yearPickerVisible}
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.yearPickerModal}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>
                Select {yearPickerType === 'start' ? 'From' : 'To'} Year
              </Text>
              <TouchableOpacity onPress={() => setYearPickerVisible(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.yearPickerScrollView}
              showsVerticalScrollIndicator={true}
            >
              {generateYears().map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearPickerItem,
                    selectedYear === year && styles.yearPickerItemSelected
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text 
                    style={[
                      styles.yearPickerItemText,
                      selectedYear === year && styles.yearPickerItemTextSelected
                    ]}
                  >
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <View style={styles.yearPickerCheckmark}>
                      <Text style={{ color: '#FFFFFF' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.yearPickerConfirmButton}
              onPress={confirmYearSelection}
            >
              <Text style={styles.yearPickerConfirmText}>Confirm</Text>
            </TouchableOpacity>
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
  footerLoader: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
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
  // New styles for search suggestions
  suggestionContainer: {
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    maxHeight: 300,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2B43',
  },
  suggestionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2B43',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
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
    position: 'relative',
    overflow: 'hidden',
  },
  genreOptionSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: '#E50914',
    borderWidth: 1,
  },
  genreOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  genreOptionTextSelected: {
    fontWeight: 'bold',
    color: '#E50914',
  },
  genreSelectedIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 20,
    borderTopWidth: 20,
    borderRightColor: 'transparent',
    borderTopColor: '#E50914',
  },

  // New rating slider styles
  ratingSliderContainer: {
    marginBottom: 24,
    marginHorizontal: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    width: 18,
    textAlign: 'center',
  },
  ratingLabelActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  ratingTrack: {
    height: 4,
    backgroundColor: '#2D2B43',
    borderRadius: 2,
    marginBottom: 8,
  },
  ratingFill: {
    height: 4,
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  ratingTouchArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingTouchPoint: {
    width: 24,
    height: 24,
    backgroundColor: '#2D2B43',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  ratingActivePoint: {
    width: 16,
    height: 16,
    backgroundColor: '#E50914',
    borderRadius: 8,
  },
  ratingDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // View controls styles 
  viewControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
  },
  sortButton: {
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewToggleActive: {
    backgroundColor: '#2D2B43',
  },
  
  // Sort options styles
  sortOptionsContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
    width: 210,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  sortOptionItemSelected: {
    backgroundColor: '#2D2B43',
  },
  sortOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  sortOptionTextSelected: {
    fontWeight: 'bold',
    color: '#E50914',
  },
  sortOptionCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Grid view styles
  gridContainer: {
    paddingTop: 8,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 16,
    backgroundColor: '#1F1D2B',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2/3,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    padding: 8,
  },
  watchlistButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    padding: 10,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridRating: {
    color: '#FFC107',
    fontSize: 12,
  },
  
  // Skeleton styles
  skeletonImage: {
    backgroundColor: '#2D2B43',
  },
  skeletonText: {
    backgroundColor: '#2D2B43',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTag: {
    backgroundColor: '#2D2B43',
    borderRadius: 4,
    height: 14,
    marginRight: 4,
    marginBottom: 4,
  },
  
  // Year UI styles
  yearRangeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearButton: {
    flex: 1,
    backgroundColor: '#2D2B43',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  yearButtonLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 4,
  },
  yearButtonValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  yearRangeSeparator: {
    paddingHorizontal: 10,
  },
  yearRangeSeparatorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  resetYearButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E50914',
    marginBottom: 20,
  },
  resetYearButtonText: {
    color: '#E50914',
    fontSize: 14,
  },
  
  // Year Picker Modal styles
  yearPickerModal: {
    backgroundColor: '#1F1D2B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    height: '70%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  yearPickerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  yearPickerScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  yearPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2B43',
  },
  yearPickerItemSelected: {
    backgroundColor: '#2D2B43',
    borderRadius: 8,
  },
  yearPickerItemText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  yearPickerItemTextSelected: {
    fontWeight: 'bold',
    color: '#E50914',
  },
  yearPickerCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPickerConfirmButton: {
    backgroundColor: '#E50914',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  yearPickerConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Modal button styles
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