import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text, 
  Image, 
  Modal, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  Pressable,
  FlatList,
  StatusBar,
  Linking,
  BackHandler
} from 'react-native';
import MapView, { 
  Marker, 
  Callout, 
  PROVIDER_GOOGLE, 
  Polyline,
  Region
} from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { findNearbyTheatres, getDirection, calculateDistance, Theatre } from '../utils/mapService';
import { debounce } from 'lodash';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define map styles
const mapStyles = {
  standard: 'standard',
  satellite: 'satellite',
  hybrid: 'hybrid'
};

// Filter options
interface FilterOptions {
  maxDistance: number; // in meters
  minRating: number;
  openNow: boolean;
}

// Define the default region - set to null initially
const DEFAULT_REGION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [filteredTheatres, setFilteredTheatres] = useState<Theatre[]>([]);
  const [selectedTheatre, setSelectedTheatre] = useState<Theatre | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSearchedRegion, setLastSearchedRegion] = useState<any>(null);
  const [isMapMoved, setIsMapMoved] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ 
    maxDistance: 10000, // 10km in meters
    minRating: 0,
    openNow: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  // Animation values for bottom sheet
  const bottomSheetHeight = useSharedValue(0);
  const filterSheetHeight = useSharedValue(0);
  
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Bottom sheet animation style
  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      height: bottomSheetHeight.value,
      transform: [
        {
          translateY: interpolate(
            bottomSheetHeight.value,
            [0, 300],
            [300, 0],
            Extrapolate.CLAMP
          )
        }
      ]
    };
  });
  
  // Filter sheet animation style
  const filterSheetStyle = useAnimatedStyle(() => {
    return {
      height: filterSheetHeight.value,
      opacity: interpolate(
        filterSheetHeight.value,
        [0, 250],
        [0, 1],
        Extrapolate.CLAMP
      )
    };
  });

  // Toggle bottom sheet
  const toggleBottomSheet = () => {
    if (isBottomSheetVisible) {
      bottomSheetHeight.value = withTiming(0, { duration: 300 });
      setTimeout(() => setIsBottomSheetVisible(false), 300);
    } else {
      setIsBottomSheetVisible(true);
      bottomSheetHeight.value = withTiming(300, { duration: 300 });
    }
  };
  
  // Toggle filter sheet
  const toggleFilterSheet = () => {
    if (showFilters) {
      filterSheetHeight.value = withTiming(0, { duration: 250 });
      setTimeout(() => setShowFilters(false), 250);
    } else {
      setShowFilters(true);
      filterSheetHeight.value = withTiming(400, { duration: 250 });
    }
  };

  // Get directions to the selected theatre
  const getDirectionsToTheatre = async (theatre: Theatre) => {
    if (!theatre) {
      Alert.alert(
        "Error",
        "Theatre information is missing. Please try again.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const destLat = theatre.location.latitude;
      const destLng = theatre.location.longitude;
      
      // Create Google Maps URL for directions - not specifying origin will use device's current location
      const url = Platform.select({
        ios: `comgooglemaps://?daddr=${destLat},${destLng}&directionsmode=driving`,
        android: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`
      });
      
      // Fallback URL if Google Maps app is not installed
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      
      // Check if Google Maps app is installed
      const canOpenGoogleMaps = url ? await Linking.canOpenURL(url) : false;
      
      if (canOpenGoogleMaps) {
        Linking.openURL(url as string);
      } else {
        // Open in web browser if app is not available
        Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(
        "Navigation Error",
        "Could not open maps for directions. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Apply filters to theaters
  const applyFilters = () => {
    if (!theatres.length) return;
    
    const filtered = theatres.filter(theatre => {
      // Filter by distance
      if (theatre.distance && theatre.distance > filterOptions.maxDistance) {
        return false;
      }
      
      // Filter by rating
      if (theatre.rating < filterOptions.minRating) {
        return false;
      }
      
      // Filter by open now
      if (filterOptions.openNow && theatre.openingHours !== 'Open now') {
        return false;
      }
      
      return true;
    });
    
    setFilteredTheatres(filtered);
    toggleFilterSheet();
    
    // If we have results, update map to show them all
    if (filtered.length > 0) {
      fitMapToMarkers(filtered);
    }
  };
  
  // Adjust map to fit all markers
  const fitMapToMarkers = (markersToFit = filteredTheatres) => {
    if (!mapRef.current || !markersToFit.length) return;
    
    mapRef.current.fitToCoordinates(
      markersToFit.map(theater => ({
        latitude: theater.location.latitude,
        longitude: theater.location.longitude
      })),
      {
        edgePadding: { top: 100, right: 100, bottom: 200, left: 100 },
        animated: true
      }
    );
  };

  // Load theatres from storage or use API with enhanced error handling
  const loadTheatresData = async (latitude: number, longitude: number, forceRefresh = false) => {
    try {
      console.log(`Loading theatres near: ${latitude}, ${longitude} ${forceRefresh ? '(forced refresh)' : ''}`);
      setIsLoading(true);
      
      // Store this region as the last searched region
      setLastSearchedRegion({
        latitude,
        longitude,
        timestamp: Date.now()
      });
      
      // Call our enhanced API service with better caching
      const nearbyTheatres = await findNearbyTheatres(latitude, longitude);
      
      console.log(`Got ${nearbyTheatres?.length || 0} theatres from API service`);
      
      if (nearbyTheatres && nearbyTheatres.length > 0) {
        console.log(`Found ${nearbyTheatres.length} theatres nearby, displaying on map`);
        
        // Ensure we have valid data in the theatre objects
        const validTheatres = nearbyTheatres.filter(theatre => 
          theatre && 
          theatre.location && 
          typeof theatre.location.latitude === 'number' && 
          typeof theatre.location.longitude === 'number'
        );
        
        if (validTheatres.length !== nearbyTheatres.length) {
          console.warn(`Filtered out ${nearbyTheatres.length - validTheatres.length} invalid theatre objects`);
        }
        
        setTheatres(validTheatres);
        setFilteredTheatres(validTheatres);
        setIsMapMoved(false);
        
        // If we have selected a theatre, update its data
        if (selectedTheatre) {
          const updatedSelected = validTheatres.find(t => t.id === selectedTheatre.id);
          if (updatedSelected) {
            setSelectedTheatre(updatedSelected);
          }
        }
        
        // Fit map to show all markers
        setTimeout(() => {
          fitMapToMarkers(validTheatres);
        }, 500); // Short delay to ensure markers are rendered
      } else {
        // Clearer message when no theaters found
        console.warn("No theaters returned from API");
        Alert.alert(
          "No Theaters Found",
          "We couldn't find any movie theaters in this area. Try moving the map to a different location or search again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Failed to load theatres', error);
      Alert.alert(
        "Error Loading Theaters",
        "There was a problem loading theater data. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get precise location with better error handling
  const getCurrentLocation = async (centerMap = true) => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setIsLoading(false);
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      // Always update region state for data loading purposes
      setRegion(newRegion);
      
      // Only animate to region if explicitly requested
      if (centerMap && mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
      
      // Always load theatres data based on current location
      loadTheatresData(newRegion.latitude, newRegion.longitude);
      setIsLoading(false);
    } catch (error) {
      setLocationError('Could not determine your location. Please check your location services.');
      setIsLoading(false);
    }
  };

  // Initial location and theatres loading
  useEffect(() => {
    // Get user location on component mount - don't center automatically
    getCurrentLocation(false);
    
    // Don't load default theatres data until we have user location
    // loadTheatresData(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
    
    return () => {
      // Clean up any subscriptions or listeners
    };
  }, []);

  // Search theaters by name - debounced
  const searchTheatres = useMemo(() => 
    debounce((query: string) => {
      if (!query.trim()) {
        setFilteredTheatres(theatres);
        return;
      }
      
      const lowercaseQuery = query.toLowerCase();
      const results = theatres.filter(theatre => 
        theatre.name.toLowerCase().includes(lowercaseQuery) ||
        theatre.address.toLowerCase().includes(lowercaseQuery)
      );
      
      setFilteredTheatres(results);
      
      // If we have search results, update map to show them
      if (results.length > 0) {
        fitMapToMarkers(results);
      }
    }, 300),
  [theatres]);

  // Apply search when search query changes
  useEffect(() => {
    if (searchQuery) {
      searchTheatres(searchQuery);
    }
  }, [searchQuery, searchTheatres]);

  // Toggle map type with enhanced cycling
  const toggleMapType = () => {
    setMapType(current => {
      switch (current) {
        case 'standard':
          return 'satellite';
        case 'satellite':
          return 'hybrid';
        case 'hybrid':
          return 'standard';
        default:
          return 'standard';
      }
    });
  };

  // Enhanced marker press to show details in bottom sheet first
  const handleMarkerPress = (theatre: Theatre) => {
    console.log(`Marker pressed for: ${theatre.name}`);
    setSelectedTheatre(theatre);
    
    // Force bottom sheet to open
    setIsBottomSheetVisible(true);
    bottomSheetHeight.value = withTiming(300, { duration: 300 });
    
    // Center map on the selected theater with animation
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: theatre.location.latitude,
        longitude: theatre.location.longitude,
        latitudeDelta: 0.005, // Zoom in more
        longitudeDelta: 0.005,
      }, 500);
    }
  };

  // Show full details modal
  const handleShowDetails = () => {
    // Make sure we have a selected theatre
    if (!selectedTheatre) {
      console.warn("No theatre selected when attempting to show details");
      return;
    }
    
    console.log(`Showing details for theatre: ${selectedTheatre.name}`);
    
    // First close the bottom sheet if it's open, then show details
    if (isBottomSheetVisible) {
      // Different handling for iOS vs Android
      if (Platform.OS === 'ios') {
        // On iOS, we can show the modal immediately and it will properly display over the bottom sheet
        setDetailsVisible(true);
        // Then close the bottom sheet
        setTimeout(() => {
          bottomSheetHeight.value = withTiming(0, { duration: 300 });
          setTimeout(() => setIsBottomSheetVisible(false), 300);
        }, 100);
      } else {
        // On Android, close bottom sheet first, then show modal after a delay
        bottomSheetHeight.value = withTiming(0, { duration: 300 });
        setTimeout(() => {
          setIsBottomSheetVisible(false);
          // Add delay before showing modal to prevent UI conflicts
          setTimeout(() => {
            console.log("Opening details modal after bottom sheet closed");
            setDetailsVisible(true);
          }, 300);
        }, 300);
      }
    } else {
      // If bottom sheet is not open, show details immediately
      setDetailsVisible(true);
    }
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchTheatres(text);
  };

  // Select a rating value for a review
  const handleRatingSelection = (value: number) => {
    setReviewRating(value);
  };

  // Submit a review for a theatre
  const submitReview = async () => {
    if (!selectedTheatre) return;
    
    try {
      // Here you would integrate with your backend API to submit the review
      // For now, we'll just update the UI optimistically
      
      Alert.alert(
        "Thank You!",
        `Your ${reviewRating}-star review has been submitted.`,
        [{ text: "OK", onPress: () => {
          setReviewText('');
          setReviewRating(5);
          setDetailsVisible(false);
        }}]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        "Review Error",
        "Could not submit your review at this time. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  // Render markers on the map with robust error handling
  const renderMarkers = () => {
    if (!filteredTheatres || filteredTheatres.length === 0) {
      return null;
    }
    
    return filteredTheatres.map((theatre, index) => {
      // Skip any invalid theatre data
      if (!theatre || !theatre.location || typeof theatre.location.latitude !== 'number' || typeof theatre.location.longitude !== 'number') {
        console.warn(`Skipping invalid theatre at index ${index}`, theatre);
        return null;
      }
      
      try {
        return (
          <Marker
            key={theatre.id || `theatre-${index}`}
            coordinate={{
              latitude: theatre.location.latitude,
              longitude: theatre.location.longitude
            }}
            title={theatre.name}
            description={theatre.address}
            pinColor={selectedTheatre?.id === theatre.id ? 'blue' : 'red'}
            onPress={() => handleMarkerPress(theatre)}
          />
        );
      } catch (error) {
        console.error(`Error rendering marker for theatre ${theatre.name}:`, error);
        return null;
      }
    });
  };

  // Render stars for rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => handleRatingSelection(i)}
          style={styles.starContainer}
        >
          <FontAwesome
            name={i <= reviewRating ? "star" : "star-o"}
            size={24}
            color={i <= reviewRating ? "#FFD700" : "#ccc"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  // Render theater detail information
  const renderTheatreDetails = () => {
    if (!selectedTheatre || !detailsVisible) return null;
    
    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={false}
        presentationStyle={Platform.OS === 'ios' ? "pageSheet" : undefined}
        statusBarTranslucent={Platform.OS === 'android'}
        hardwareAccelerated={Platform.OS === 'android'}
        onRequestClose={() => {
          console.log("Closing details modal");
          setDetailsVisible(false);
        }}
      >
        <View style={[
          styles.detailsContainer, 
          { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }
        ]}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              Platform.OS === 'ios' && styles.iosCloseButton
            ]}
            onPress={() => {
              console.log("Closing details modal");
              setDetailsVisible(false);
            }}
          >
            <Ionicons
              name="close"
              size={28}
              color="#333"
            />
          </TouchableOpacity>
          
          <ScrollView style={styles.detailsScroll}>
            <View style={styles.theatreImageContainer}>
              <Image 
                source={{ uri: selectedTheatre.photos?.[0] || 'https://via.placeholder.com/400x200?text=Theatre' }} 
                style={styles.theatreImage} 
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageGradient}
              />
              <Text style={styles.theatreTitle}>{selectedTheatre.name}</Text>
            </View>
            
            <View style={styles.detailsContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <FontAwesome
                    name="star"
                    size={20}
                    color="#FFD700"
                  />
                  <Text style={styles.infoText}>{selectedTheatre.rating.toFixed(1)} ⭐</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="location"
                    size={20}
                    color="#FF5252"
                  />
                  <Text style={styles.infoText}>
                    {selectedTheatre.distance ? `${(selectedTheatre.distance / 1000).toFixed(1)} km` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.infoText}>{selectedTheatre.openingHours || 'Hours N/A'}</Text>
                </View>
              </View>
              
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Address</Text>
                <Text style={styles.sectionText}>{selectedTheatre.address}</Text>
                
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.directionButton]}
                    onPress={() => getDirectionsToTheatre(selectedTheatre)}
                  >
                    <Ionicons
                      name="navigate"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => selectedTheatre.phoneNumber && Linking.openURL(`tel:${selectedTheatre.phoneNumber}`)}
                  >
                    <Ionicons
                      name="call"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.websiteButton]}
                    onPress={() => openWebsite(selectedTheatre.website)}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Website</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Now Showing</Text>
                {selectedTheatre.nowShowing && selectedTheatre.nowShowing.length > 0 ? (
                  <FlatList
                    data={selectedTheatre.nowShowing}
                    keyExtractor={(item, index) => `detail-movie-${item.id || index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.movieCard}
                        onPress={() => router.push(`/movie/${item.id}`)}
                      >
                        <Image 
                          source={{ uri: item.poster || 'https://via.placeholder.com/100x150?text=Movie' }} 
                          style={styles.moviePoster} 
                        />
                        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.movieTime}>{item.showtime}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <Text style={styles.noDataText}>No movie information available</Text>
                )}
              </View>
              
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Leave a Review</Text>
                <View style={styles.ratingContainer}>
                  {renderStars(reviewRating)}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience..."
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[
                    styles.submitButton, 
                    (!reviewText.trim() && styles.disabledButton)
                  ]}
                  disabled={!reviewText.trim()}
                  onPress={submitReview}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {selectedTheatre.reviews?.length > 0 ? (
                  selectedTheatre.reviews.map((review, index) => (
                    <View key={`review-${index}`} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUser}>
                          <FontAwesome
                            name="user-circle"
                            size={24}
                            color="#666"
                          />
                          <Text style={styles.reviewAuthor}>{review.author}</Text>
                        </View>
                        <View style={styles.reviewRating}>
                          <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                          <FontAwesome
                            name="star"
                            size={14}
                            color="#FFD700"
                          />
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Render the bottom info sheet
  const renderBottomSheet = () => {
    if (!selectedTheatre) return null;
    
    return (
      <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
        <View style={styles.bottomSheetHeader}>
          <View style={styles.bottomSheetHandle} />
          <TouchableOpacity 
            style={styles.closeBottomSheetButton}
            onPress={toggleBottomSheet}
          >
            <Ionicons
              name="close"
              size={24}
              color="#333"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSheetContent}>
          <View style={styles.theatreInfoHeader}>
            <View style={{width: '100%'}}>
              <Text style={styles.theatreName}>{selectedTheatre.name}</Text>
              <Text style={styles.theatreAddress} numberOfLines={1}>{selectedTheatre.address}</Text>
            </View>
          </View>
          
          <View style={styles.quickInfoRow}>
            <View style={styles.quickInfoItem}>
              <FontAwesome
                name="star"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.quickInfoText}>{(selectedTheatre.rating || 0).toFixed(1)}</Text>
            </View>
            
            <View style={styles.quickInfoItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color="#4CAF50"
              />
              <Text style={styles.quickInfoText}>{selectedTheatre.openingHours || 'Hours N/A'}</Text>
            </View>
            
            <View style={styles.quickInfoItem}>
              <MaterialIcons
                name="attach-money"
                size={16}
                color="#FFA000"
              />
              <Text style={styles.quickInfoText}>{selectedTheatre.placeDetails?.price_level ?? 'Price N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButtonSmall}
              onPress={() => getDirectionsToTheatre(selectedTheatre)}
            >
              <Ionicons
                name="navigate"
                size={20}
                color="#2196F3"
              />
              <Text style={styles.actionButtonTextSmall}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButtonSmall}
              onPress={() => selectedTheatre.phoneNumber && Linking.openURL(`tel:${selectedTheatre.phoneNumber}`)}
            >
              <Ionicons
                name="call"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.actionButtonTextSmall}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButtonSmall, styles.detailsButton]}
              onPress={handleShowDetails}
              activeOpacity={0.6}
              pressRetentionOffset={{ top: 10, left: 10, bottom: 10, right: 10 }}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color="#FF9800"
              />
              <Text style={styles.actionButtonTextSmall}>Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButtonSmall}
              onPress={() => openWebsite(selectedTheatre.website)}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color="#9C27B0"
              />
              <Text style={styles.actionButtonTextSmall}>Website</Text>
            </TouchableOpacity>
          </View>
          
          {selectedTheatre.nowShowing && selectedTheatre.nowShowing.length > 0 && (
            <View style={styles.quickMovieList}>
              <Text style={styles.quickSectionTitle}>Now Showing:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedTheatre.nowShowing.map((movie: { id: string; title: string; poster: string; showtime: string }, index: number) => (
                  <TouchableOpacity 
                    key={`quick-movie-${movie.id || index}`}
                    style={styles.quickMovieItem}
                    onPress={() => router.push(`/movie/${movie.id}`)}
                  >
                    <Image 
                      source={{ uri: movie.poster || 'https://via.placeholder.com/60x90?text=Movie' }} 
                      style={styles.quickMoviePoster}
                    />
                    <Text style={styles.quickMovieTitle} numberOfLines={1}>{movie.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Render filter options panel
  const renderFilterPanel = () => {
    return (
      <Animated.View style={[styles.filterPanel, filterSheetStyle]}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter Theaters</Text>
          <TouchableOpacity onPress={toggleFilterSheet}>
            <Ionicons
              name="close"
              size={24}
              color="#333"
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Maximum Distance</Text>
            <Text style={styles.filterValue}>{(filterOptions.maxDistance / 1000).toFixed(1)} km</Text>
            <Slider
              style={styles.slider}
              minimumValue={1000}
              maximumValue={25000}
              step={1000}
              value={filterOptions.maxDistance}
              onValueChange={(value: number) => setFilterOptions({...filterOptions, maxDistance: value})}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#2196F3"
            />
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingFilter}>
              {[0, 1, 2, 3, 4].map(rating => (
                <TouchableOpacity 
                  key={`filter-rating-${rating}`}
                  style={[
                    styles.ratingOption,
                    filterOptions.minRating === rating && styles.selectedRating
                  ]}
                  onPress={() => setFilterOptions({...filterOptions, minRating: rating})}
                >
                  <Text style={styles.ratingText}>
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <View style={styles.filterSwitchRow}>
              <Text style={styles.filterSectionTitle}>Open Now</Text>
              <Pressable
                style={[
                  styles.switchTrack,
                  filterOptions.openNow && styles.switchTrackActive
                ]}
                onPress={() => setFilterOptions({
                  ...filterOptions, 
                  openNow: !filterOptions.openNow
                })}
              >
                <View style={[
                  styles.switchThumb,
                  filterOptions.openNow && styles.switchThumbActive
                ]} />
              </Pressable>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.applyFilterButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyFilterText}>Apply Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  };

  // Handle region change for map
  const handleRegionChangeComplete = (newRegion: Region) => {
    // Don't trigger if map is just initializing
    if (isLoading) return;
    
    // Only update the region state if user manually moved the map (for both iOS and Android)
    // Check if the region change is significant enough to be a user interaction
    const distanceChange = calculateDistance(
      region.latitude,
      region.longitude,
      newRegion.latitude,
      newRegion.longitude
    );
    
    // Only update if movement is larger than typical GPS jitter
    if (distanceChange > 0.02) { // 20 meters threshold
      setRegion(newRegion);
    }
    
    // Compare with last searched region to determine if we should show "Search this area" button
    if (lastSearchedRegion) {
      const distance = calculateDistance(
        lastSearchedRegion.latitude,
        lastSearchedRegion.longitude,
        newRegion.latitude,
        newRegion.longitude
      );
      
      // If moved more than 1km from last search, show the button
      if (distance > 1) {
        setIsMapMoved(true);
      }
    }
  };

  // Refresh theatres based on current location
  const refreshTheatres = async () => {
    await getCurrentLocation(true);
  };
  
  // Search theatres in current map view
  const searchThisArea = async () => {
    setIsLoading(true);
    await loadTheatresData(region.latitude, region.longitude, true);
    setIsMapMoved(false);
  };

  // Close details modal
  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setReviewText('');
    setReviewRating(5);
  };

  // Add a photo
  const handleAddPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to grant permission to access your photos.",
          [{ text: "OK" }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // In a real app, you would upload this to your server
        // For now, we'll just add it to the local state
        
        if (selectedTheatre) {
          // Create a copy of the theatres array
          const updatedTheatres = [...theatres];
          // Find the selected theatre
          const theatreIndex = updatedTheatres.findIndex(t => t.id === selectedTheatre.id);
          
          if (theatreIndex !== -1) {
            // Create a copy of the theatre
            const updatedTheatre = { ...updatedTheatres[theatreIndex] };
            // Add the new photo
            updatedTheatre.photos = [...updatedTheatre.photos, selectedAsset.uri];
            // Update the theatre in the array
            updatedTheatres[theatreIndex] = updatedTheatre;
            // Update the state
            setTheatres(updatedTheatres);
            setFilteredTheatres(
              searchQuery ? 
                updatedTheatres.filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.address.toLowerCase().includes(searchQuery.toLowerCase())
                ) : 
                updatedTheatres
            );
            setSelectedTheatre(updatedTheatre);
            
            // Show success message
            Alert.alert(
              "Photo Added",
              "Your photo has been successfully added. Thank you for contributing!",
              [{ text: "OK" }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert(
        "Error",
        "There was a problem adding your photo. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Add a review
  const handleAddReview = () => {
    if (!reviewText.trim()) {
      Alert.alert(
        "Empty Review",
        "Please write something in your review.",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (selectedTheatre) {
      // Create a new review object
      const newReview = {
        id: Date.now().toString(),
        rating: reviewRating,
        text: reviewText.trim(),
        date: new Date().toISOString(),
      };
      
      // Create a copy of the theatres array
      const updatedTheatres = [...theatres];
      // Find the selected theatre
      const theatreIndex = updatedTheatres.findIndex(t => t.id === selectedTheatre.id);
      
      if (theatreIndex !== -1) {
        // Create a copy of the theatre
        const updatedTheatre = { ...updatedTheatres[theatreIndex] };
        // Add the new review
        updatedTheatre.reviews = [newReview, ...updatedTheatre.reviews];
        // Update the rating (average of all reviews)
        const totalRating = updatedTheatre.reviews.reduce((sum, r) => sum + r.rating, 0);
        updatedTheatre.rating = parseFloat((totalRating / updatedTheatre.reviews.length).toFixed(1));
        // Update the theatre in the array
        updatedTheatres[theatreIndex] = updatedTheatre;
        // Update the state
        setTheatres(updatedTheatres);
        setFilteredTheatres(
          searchQuery ? 
            updatedTheatres.filter(t => 
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.address.toLowerCase().includes(searchQuery.toLowerCase())
            ) : 
            updatedTheatres
        );
        setSelectedTheatre(updatedTheatre);
        
        // Reset the review form
        setReviewText('');
        setReviewRating(5);
        
        // Show success message
        Alert.alert(
          "Review Submitted",
          "Your review has been successfully submitted. Thank you for your feedback!",
          [{ text: "OK" }]
        );
      }
    }
  };

  // Open directions in maps app
  const openDirectionsInMapsApp = (theatre: Theatre) => {
    getDirectionsToTheatre(theatre);
  };
  
  // Call the theater
  const callTheater = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert(
        "No Phone Number",
        "This theater does not have a registered phone number.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const formattedNumber = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(formattedNumber)
      .then(supported => {
        if (supported) {
          Linking.openURL(formattedNumber);
        } else {
          Alert.alert(
            "Error",
            "Phone calls are not supported on this device.",
            [{ text: "OK" }]
          );
        }
      })
      .catch(err => {
        console.error('Error making phone call:', err);
        Alert.alert(
          "Error",
          "Could not make a phone call at this time.",
          [{ text: "OK" }]
        );
      });
  };
  
  // Open website
  const openWebsite = (website?: string) => {
    Alert.alert(
      "Coming Soon",
      "Theater website integration will be implemented in a future update.",
      [{ text: "OK" }]
    );
  };

  // Calculate distance between two points in km using Haversine formula
  const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in meters

    return distance;
  };

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      searchTheatres(text);
    }, 300),
    [theatres]
  );

  // Effect to handle back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (detailsVisible) {
          console.log("Android back button pressed while details modal is open");
          setDetailsVisible(false);
          return true; // Prevent default back button behavior
        }
        return false; // Allow default back button behavior
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }
  }, [detailsVisible]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        region={undefined}
        mapType={mapType}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={true}
        loadingEnabled
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {renderMarkers()}
      </MapView>
      
      {/* Search bar at the top */}
      <View style={[styles.searchBarContainer, { top: insets.top + 10 }]}>
        <View style={[
          styles.searchBar,
          isSearchBarFocused && styles.searchBarFocused
        ]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={22}
              color="#333"
            />
          </TouchableOpacity>
          
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search theatres by name or location"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setIsSearchBarFocused(true)}
            onBlur={() => setIsSearchBarFocused(false)}
            returnKeyType="search"
          />
          
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setFilteredTheatres(theatres);
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name="search"
              size={20}
              color="#999"
            />
          )}
        </View>
      </View>
      
      {/* Control buttons */}
      <View style={[styles.mapControls, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => getCurrentLocation(true)}
        >
          <MaterialIcons
            name="my-location"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleMapType}
        >
          <FontAwesome5 name="layer-group" size={20} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleFilterSheet}
        >
          <Ionicons
            name="filter"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        
        {isMapMoved && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.searchAreaButton]}
            onPress={() => loadTheatresData(region.latitude, region.longitude, true)}
          >
            <Text style={styles.searchAreaText}>Search This Area</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading theatres...</Text>
        </View>
      )}
      
      {/* Location error message */}
      {locationError && (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error"
            size={24}
            color="#FF5252"
          />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
      
      {/* Bottom sheets */}
      {isBottomSheetVisible && renderBottomSheet()}
      {showFilters && renderFilterPanel()}
      {selectedTheatre && renderTheatreDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBarFocused: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 8,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchAreaButton: {
    width: 'auto',
    paddingHorizontal: 12,
    paddingRight: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  searchAreaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#D32F2F',
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 16,
    overflow: 'hidden',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  bottomSheetContent: {
    padding: 16,
  },
  theatreInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  theatreName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    width: '100%',
  },
  theatreAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    width: '100%',
  },
  quickInfoRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quickInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButtonSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionButtonTextSmall: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  quickMovieList: {
    marginTop: 8,
  },
  quickSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  quickMovieItem: {
    marginRight: 12,
    width: 70,
  },
  quickMoviePoster: {
    width: 70,
    height: 100,
    borderRadius: 6,
  },
  quickMovieTitle: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  filterPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 16,
    overflow: 'hidden',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ratingFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedRating: {
    backgroundColor: '#2196F3',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    padding: 3,
  },
  switchTrackActive: {
    backgroundColor: '#2196F3',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  applyFilterButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  applyFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  detailsScroll: {
    flex: 1,
  },
  theatreImageContainer: {
    position: 'relative',
    height: 200,
  },
  theatreImage: {
    width: '100%',
    height: 200,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  theatreTitle: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  detailsContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  directionButton: {
    backgroundColor: '#2196F3',
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  websiteButton: {
    backgroundColor: '#9C27B0',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  movieCard: {
    width: 120,
    marginRight: 12,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    color: '#333',
  },
  movieTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starContainer: {
    marginRight: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
    color: '#333',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  closeBottomSheetButton: {
    position: 'absolute',
    right: 16,
    top: 10,
    padding: 8,
    zIndex: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#E50914',
  },
  detailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iosCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
}); 