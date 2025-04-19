import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  FlatList, 
  Keyboard,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchPlaces } from '../utils/apiService';

interface SearchResult {
  id: string;
  name: string;
  placeName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface Props {
  onSearchSelect: (result: SearchResult) => void;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  darkMode?: boolean;
}

const HISTORY_STORAGE_KEY = 'map_search_history';
const MAX_HISTORY_ITEMS = 10;

const EnhancedSearch: React.FC<Props> = ({ 
  onSearchSelect, 
  onSearchChange,
  placeholder = 'Search for theaters...',
  darkMode = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  
  const screenHeight = Dimensions.get('window').height;
  const maxResultsHeight = screenHeight * 0.4; // 40% of screen height

  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Animate results panel height
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showResults ? maxResultsHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showResults, maxResultsHeight]);

  // Load search history from storage
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Save search history to storage
  const saveSearchHistory = async (newHistory: SearchResult[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Add item to search history
  const addToSearchHistory = (item: SearchResult) => {
    // Remove if already exists to prevent duplicates
    const filteredHistory = searchHistory.filter(h => h.id !== item.id);
    
    // Add new item at the beginning
    const newHistory = [item, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // Handle search input change with debounce
  const handleSearchChange = async (text: string) => {
    setQuery(text);
    setIsTyping(true);
    onSearchChange(text);
    
    if (text.trim().length > 2) {
      setIsLoading(true);
      setShowResults(true);
      
      try {
        // Debounce implementation would be better here
        // This is a simplified version for clarity
        const searchResults = await searchPlaces(text);
        setResults(searchResults);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    } else if (!text.trim()) {
      setResults([]);
      setShowResults(!!searchHistory.length);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Handle search result selection
  const handleResultSelect = (item: SearchResult) => {
    setQuery(item.name);
    setShowResults(false);
    addToSearchHistory(item);
    onSearchSelect(item);
    Keyboard.dismiss();
  };

  // Handle history item selection
  const handleHistorySelect = (item: SearchResult) => {
    setQuery(item.name);
    setShowResults(false);
    onSearchSelect(item);
    Keyboard.dismiss();
  };

  // Clear search query
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    onSearchChange('');
    inputRef.current?.focus();
  };

  // Clear search history
  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  // Focus the search input
  const focusSearch = () => {
    inputRef.current?.focus();
    setShowResults(true);
  };

  // Render a search result item
  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={[styles.resultItem, darkMode && styles.resultItemDark]} 
      onPress={() => handleResultSelect(item)}
    >
      <MaterialIcons 
        name="place" 
        size={20} 
        color={darkMode ? "#FF6B6B" : "#FF5252"} 
        style={styles.resultIcon} 
      />
      <View style={styles.resultTextContainer}>
        <Text style={[styles.resultName, darkMode && styles.resultNameDark]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.resultAddress, darkMode && styles.resultAddressDark]} numberOfLines={1}>
          {item.placeName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render a history item
  const renderHistoryItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={[styles.historyItem, darkMode && styles.historyItemDark]} 
      onPress={() => handleHistorySelect(item)}
    >
      <Ionicons 
        name="time-outline" 
        size={20} 
        color={darkMode ? "#8D9CB8" : "#777"} 
        style={styles.historyIcon} 
      />
      <Text style={[styles.historyText, darkMode && styles.historyTextDark]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchContainer, darkMode && styles.searchContainerDark]}>
        <TouchableOpacity onPress={focusSearch} style={styles.searchIconContainer}>
          <MaterialIcons name="search" size={24} color={darkMode ? "#8D9CB8" : "#555"} />
        </TouchableOpacity>
        
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, darkMode && styles.searchInputDark]}
          placeholder={placeholder}
          placeholderTextColor={darkMode ? "#8D9CB8" : "#999"}
          value={query}
          onChangeText={handleSearchChange}
          onFocus={() => setShowResults(true)}
          returnKeyType="search"
        />
        
        {query ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialIcons name="clear" size={22} color={darkMode ? "#8D9CB8" : "#777"} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Panel */}
      <Animated.View 
        style={[
          styles.resultsContainer, 
          { height: animatedHeight },
          darkMode && styles.resultsContainerDark
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.statusText, darkMode && styles.statusTextDark]}>Searching...</Text>
          </View>
        ) : (
          <>
            {/* Search Results */}
            {results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
              />
            ) : isTyping ? (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.statusText, darkMode && styles.statusTextDark]}>
                  Searching...
                </Text>
              </View>
            ) : query && !isTyping ? (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.statusText, darkMode && styles.statusTextDark]}>
                  No results found
                </Text>
              </View>
            ) : null}
            
            {/* Search History */}
            {!query && searchHistory.length > 0 && (
              <>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyHeaderText, darkMode && styles.historyHeaderTextDark]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearHistoryText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={searchHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item) => `history-${item.id}`}
                  style={styles.historyList}
                />
              </>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchContainerDark: {
    backgroundColor: '#2C3A47',
    borderColor: '#445566',
  },
  searchIconContainer: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 8,
  },
  searchInputDark: {
    color: '#E2E8F0',
  },
  clearButton: {
    padding: 8,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsContainerDark: {
    backgroundColor: '#2C3A47',
    borderColor: '#445566',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultItemDark: {
    borderBottomColor: '#3D4D5C',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  resultNameDark: {
    color: '#E2E8F0',
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultAddressDark: {
    color: '#8D9CB8',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  historyHeaderTextDark: {
    color: '#E2E8F0',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '500',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyItemDark: {
    borderBottomColor: '#3D4D5C',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyText: {
    fontSize: 15,
    color: '#555',
  },
  historyTextDark: {
    color: '#A4B3C6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#777',
  },
  statusTextDark: {
    color: '#8D9CB8',
  },
});

export default EnhancedSearch; 