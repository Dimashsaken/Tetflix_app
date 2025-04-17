import React, { useState, useEffect, useRef } from 'react';
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
  Animated
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { findNearbyTheatres } from '../utils/mapService';

// Define types
interface Review {
  id: string;
  text: string;
  rating: number;
  date: string;
}

interface Theatre {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  address: string;
  photos: string[];
  reviews: Review[];
  searchTerm?: string; // Optional field to track which search term found this theater
}

// Default region for Hong Kong
const DEFAULT_REGION = {
  latitude: 22.3193,
  longitude: 114.1694,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [selectedTheatre, setSelectedTheatre] = useState<Theatre | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSearchedRegion, setLastSearchedRegion] = useState<any>(null);
  const [isMapMoved, setIsMapMoved] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  
  // Only keep the map type state, remove the other UI-related states
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Load theatres from storage or use API
  const loadTheatresData = async (latitude: number, longitude: number) => {
    try {
      console.log(`Loading theatres near: ${latitude}, ${longitude}`);
      setIsLoading(true);
      
      // Store this region as the last searched region
      setLastSearchedRegion({
        latitude,
        longitude,
        timestamp: Date.now()
      });
      
      // Always get fresh data from API to ensure theatres are near current location
      const nearbyTheatres = await findNearbyTheatres(latitude, longitude);
      
      if (nearbyTheatres && nearbyTheatres.length > 0) {
        console.log(`Found ${nearbyTheatres.length} theatres nearby`);
        setTheatres(nearbyTheatres);
        // Store the fetched theatres with location info
        await AsyncStorage.setItem('theatres', JSON.stringify({
          timestamp: Date.now(),
          userLocation: { latitude, longitude },
          data: nearbyTheatres
        }));
        setIsMapMoved(false);
      } else {
        // If no theatres found, check if we have stored ones that are somewhat nearby
        const storedData = await AsyncStorage.getItem('theatres');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.data && parsedData.data.length > 0) {
            setTheatres(parsedData.data);
            console.log('Using cached theatre data');
          } else {
            // No stored data either, show a user-friendly message
            Alert.alert(
              "No Theaters Found",
              "We couldn't find any movie theaters in this area. Try moving the map to a different location or search again later.",
              [{ text: "OK" }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to load theatres', error);
      // Check if there's any stored data to use as fallback
      try {
        const storedData = await AsyncStorage.getItem('theatres');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.data && parsedData.data.length > 0) {
            setTheatres(parsedData.data);
            console.log('Using cached theatre data after error');
          }
        }
      } catch (storageError) {
        console.error('Could not access stored data', storageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get precise location and handle errors better
  const getCurrentLocation = async () => {
    try {
      setLocationError(null);
      setIsLoading(true);
      
      // First check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError('Location services are disabled. Please enable them in your device settings.');
        setIsLoading(false);
        setRegion(DEFAULT_REGION);
        return;
      }
      
      // Request foreground permissions with better error handling
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Using default location.');
        setIsLoading(false);
        setRegion(DEFAULT_REGION);
        await loadTheatresData(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
        return;
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      console.log(`Got location: ${location.coords.latitude}, ${location.coords.longitude}`);
      
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(currentRegion);
      
      // Load theatres near user location
      await loadTheatresData(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not determine your location. Using default location.');
      setRegion(DEFAULT_REGION);
      await loadTheatresData(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
    }
  };

  // Initial location and theatres loading
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Save theatres to storage when they change
  useEffect(() => {
    if (!isLoading && theatres.length > 0) {
      const saveTheatres = async () => {
        try {
          await AsyncStorage.setItem('theatres', JSON.stringify({
            timestamp: Date.now(),
            userLocation: { latitude: region.latitude, longitude: region.longitude },
            data: theatres
          }));
        } catch (error) {
          console.error('Failed to save theatres', error);
        }
      };
  
      saveTheatres();
    }
  }, [theatres, isLoading]);

  // Toggle map type
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

  const handleMarkerPress = (theatre: Theatre) => {
    setSelectedTheatre(theatre);
  };

  const handleShowDetails = () => {
    setDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
  };

  const handleAddReview = async () => {
    if (!reviewText.trim() || !selectedTheatre) return;

    const newReview: Review = {
      id: Date.now().toString(),
      text: reviewText,
      rating: reviewRating,
      date: new Date().toISOString(),
    };

    const updatedTheatres = theatres.map(theatre => 
      theatre.id === selectedTheatre.id 
        ? { ...theatre, reviews: [...theatre.reviews, newReview] } 
        : theatre
    );

    setTheatres(updatedTheatres);
    setReviewText('');
    setReviewRating(5);
  };

  const handleAddPhoto = async () => {
    if (!selectedTheatre) return;
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const updatedTheatres = theatres.map(theatre =>
        theatre.id === selectedTheatre.id
          ? { ...theatre, photos: [...theatre.photos, result.assets[0].uri] }
          : theatre
      );

      setTheatres(updatedTheatres);
    }
  };

  const refreshTheatres = async () => {
    setIsLoading(true);
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Error refreshing theatres:', error);
      setIsLoading(false);
    }
  };
  
  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    
    // Calculate distance between new region and last searched region
    if (lastSearchedRegion) {
      const latDiff = Math.abs(newRegion.latitude - lastSearchedRegion.latitude);
      const lngDiff = Math.abs(newRegion.longitude - lastSearchedRegion.longitude);
      
      // If the map has moved significantly (about 2km), set flag to show "Search this area" button
      if (latDiff > 0.02 || lngDiff > 0.02) {
        setIsMapMoved(true);
      }
    }
  };
  
  const searchThisArea = async () => {
    setIsLoading(true);
    try {
      await loadTheatresData(region.latitude, region.longitude);
    } catch (error) {
      console.error('Error searching this area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => selectedTheatre ? setReviewRating(star) : null}
          >
            <FontAwesome
              name={star <= rating ? 'star' : 'star-o'}
              size={18}
              color="#FFD700"
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E21221" />
        <Text style={styles.loadingText}>Finding movie theatres near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Movie Theatres',
          headerShown: true,
        }}
      />
      
      {locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={handleRegionChangeComplete}
        mapType={mapType}
      >
        {theatres.map((theatre) => (
          <Marker
            key={theatre.id}
            coordinate={theatre.location}
            title={theatre.name}
            description={`Rating: ${theatre.rating}/5`}
            onPress={() => handleMarkerPress(theatre)}
            pinColor={theatre.rating >= 4 ? '#4CAF50' : theatre.rating >= 3 ? '#FFC107' : '#F44336'}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{theatre.name}</Text>
                <Text>{theatre.address}</Text>
                {renderStars(theatre.rating)}
                <TouchableOpacity 
                  onPress={handleShowDetails}
                  style={styles.seeMoreButton}
                >
                  <Text style={styles.seeMoreText}>See more</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Only keep the map type toggle button */}
      <TouchableOpacity 
        style={styles.mapTypeButton}
        onPress={toggleMapType}
      >
        <FontAwesome name="map" size={20} color="white" />
      </TouchableOpacity>
      
      {/* "Search this area" button */}
      {isMapMoved && (
        <TouchableOpacity 
          style={styles.searchAreaButton}
          onPress={searchThisArea}
        >
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={refreshTheatres}
      >
        <Ionicons name="refresh" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Theatre Details Modal */}
      {selectedTheatre && (
        <Modal
          visible={detailsVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseDetails}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseDetails}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <ScrollView>
              <Text style={styles.theatreName}>{selectedTheatre.name}</Text>
              <Text style={styles.theatreAddress}>{selectedTheatre.address}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(selectedTheatre.rating)}
                <Text style={styles.ratingText}>
                  {selectedTheatre.rating.toFixed(1)}/5
                </Text>
              </View>

              {/* Photos Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                  {selectedTheatre.photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.photo} />
                  ))}
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                    <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Reviews Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {selectedTheatre.reviews.length > 0 ? (
                  selectedTheatre.reviews.map((review) => (
                    <View key={review.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        {renderStars(review.rating)}
                        <Text style={styles.reviewDate}>
                          {new Date(review.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
                )}

                {/* Add Review Section */}
                <View style={styles.addReviewContainer}>
                  <Text style={styles.addReviewTitle}>Add Your Review</Text>
                  <View style={styles.ratingInput}>
                    {renderStars(reviewRating)}
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Write your review here..."
                    placeholderTextColor="#6B7280"
                    multiline
                    value={reviewText}
                    onChangeText={setReviewText}
                  />
                  <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleAddReview}
                  >
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Data Source Information */}
              {selectedTheatre.searchTerm && (
                <View style={styles.dataSourceContainer}>
                  <Text style={styles.dataSourceText}>
                    Data source: {selectedTheatre.searchTerm === 'google_places' ? 'Google Places API' : 'Mapbox API'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1D2B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1D2B',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#E21221',
    padding: 10,
    width: '100%',
    zIndex: 1,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  seeMoreButton: {
    marginTop: 5,
    padding: 5,
    backgroundColor: '#E21221',
    borderRadius: 5,
    alignItems: 'center',
  },
  seeMoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#E21221',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  searchAreaButton: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: '#E21221',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  searchAreaText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1F1D2B',
    padding: 20,
    paddingTop: 50,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
    backgroundColor: '#E21221',
    borderRadius: 20,
    padding: 5,
  },
  theatreName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  theatreAddress: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingText: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
  },
  addPhotoButton: {
    width: 120,
    height: 90,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    color: '#FFFFFF',
    marginTop: 5,
  },
  reviewItem: {
    backgroundColor: '#2A2D3A',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewDate: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noReviewsText: {
    color: '#A0A0A0',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  addReviewContainer: {
    backgroundColor: '#2A2D3A',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  ratingInput: {
    marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#E21221',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dataSourceContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  dataSourceText: {
    color: '#A0A0A0',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  mapTypeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1F1D2B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
}); 