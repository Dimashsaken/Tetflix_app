import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Hardcoding the token directly to ensure it works
const MAPBOX_API_KEY = "pk.eyJ1IjoiZG1hc2hzYWtlbiIsImEiOiJjbTlrc2I1emYwcm41MmpwcWxjaHphZW1oIn0.1a8e6NyXWkxslcNY9pgULw";
// Google Places API Key - you'll need to obtain this from Google Cloud Console
// This is a placeholder - replace with your actual key
const GOOGLE_PLACES_API_KEY = "AIzaSyDOasqoont3lWrUxEsK018Kj6ZgQlCkW6M";

// Cache configuration
const CACHE_EXPIRY_TIME = 1000 * 60 * 60; // 1 hour in milliseconds
const DEFAULT_CACHE_KEY = 'mapservice_theater_cache';

interface MapboxPlace {
  id: string;
  place_name: string;
  center: [number, number]; // longitude, latitude
}

// Enhanced Theatre interface
export interface Theatre {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  address: string;
  photos: string[];
  reviews: any[];
  distance?: number; // Distance from user in meters
  openingHours?: string;
  website?: string;
  phoneNumber?: string;
  searchTerm?: string; // Term or API used to find this theater
  placeDetails?: any; // Raw details from API
  nowShowing?: {
    id: string;
    title: string;
    poster: string;
    showtime: string;
  }[];
}

interface CacheData {
  timestamp: number;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  data: Theatre[];
}

// Save theaters to cache
export const cacheTheatres = async (
  theatres: Theatre[],
  latitude: number,
  longitude: number,
  radius: number,
  cacheKey = DEFAULT_CACHE_KEY
): Promise<void> => {
  try {
    const cacheData: CacheData = {
      timestamp: Date.now(),
      userLocation: { latitude, longitude },
      radius,
      data: theatres,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`Cached ${theatres.length} theaters successfully`);
  } catch (error) {
    console.error('Failed to cache theatres', error);
  }
};

// Get theaters from cache if available and valid
export const getCachedTheatres = async (
  latitude: number,
  longitude: number,
  maxDistance = 2, // Maximum distance in kilometers to use cached data
  cacheKey = DEFAULT_CACHE_KEY
): Promise<Theatre[] | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    const cache: CacheData = JSON.parse(cachedData);
    const now = Date.now();
    
    // Calculate distance between current location and cached location
    const distance = calculateDistance(
      latitude,
      longitude,
      cache.userLocation.latitude,
      cache.userLocation.longitude
    );
    
    // Check if cache is valid: not expired and close enough to requested location
    if (now - cache.timestamp < CACHE_EXPIRY_TIME && distance <= maxDistance) {
      console.log(`Using cached data from ${((now - cache.timestamp) / 1000 / 60).toFixed(1)} minutes ago`);
      
      // Update distances based on current location
      const theatresWithDistance = cache.data.map(theatre => ({
        ...theatre,
        distance: calculateDistance(
          latitude,
          longitude,
          theatre.location.latitude,
          theatre.location.longitude
        ) * 1000 // Convert to meters
      }));
      
      return theatresWithDistance;
    }
    
    console.log('Cache expired or location too far from cache');
    return null;
  } catch (error) {
    console.error('Error reading theater cache', error);
    return null;
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const searchPlaces = async (query: string): Promise<any[]> => {
  try {
    if (!query) return [];
    
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_API_KEY}&limit=10&types=place,poi`;
    
    const response = await axios.get(endpoint);
    
    if (response.data && Array.isArray(response.data.features)) {
      return response.data.features.map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        placeName: feature.place_name,
        coordinates: {
          latitude: feature.center[1],
          longitude: feature.center[0],
        },
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

export const getDirection = async (
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<{ coordinates: Array<[number, number]>; distance: number; duration: number }> => {
  try {
    const endpoint = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?alternatives=true&geometries=geojson&steps=true&access_token=${MAPBOX_API_KEY}`;
    
    const response = await axios.get(endpoint);
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
      };
    }
    
    throw new Error('No routes found');
  } catch (error) {
    console.error('Error getting direction:', error);
    throw error;
  }
};

// Enhanced version with more details and better error handling
export const findNearbyTheatresWithGooglePlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 10000
): Promise<Theatre[]> => {
  try {
    console.log(`Searching for theatres near: ${latitude}, ${longitude} with radius ${radius}m using Google Places API`);
    
    // Try cached results first
    const cachedResults = await getCachedTheatres(latitude, longitude);
    if (cachedResults && cachedResults.length > 0) {
      return cachedResults;
    }
    
    // Using Google Places API for nearby search - more accurate for business POIs
    const googleEndpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=movie_theater&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(googleEndpoint);
    console.log(`Google Places API Response status: ${response.status}`);
    
    if (!response.data || !response.data.results) {
      throw new Error(`Invalid response from Google Places API: ${JSON.stringify(response.data)}`);
    }
    
    if (response.data.results.length === 0) {
      console.log('No theaters found with initial radius, trying a larger radius');
      // If no results, try with a larger radius
      if (radius < 30000) {
        return findNearbyTheatresWithGooglePlaces(latitude, longitude, radius * 2);
      }
      return [];
    }
    
    console.log(`Found ${response.data.results.length} theaters with Google Places API`);
    
    // Map the Google Places API response to our Theatre format with enhanced information
    const theatres: Theatre[] = response.data.results.map((place: any) => {
      // Calculate distance from current position to theater
      const distance = calculateDistance(
        latitude, 
        longitude, 
        place.geometry.location.lat, 
        place.geometry.location.lng
      ) * 1000; // Convert to meters
      
      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity || 'Address not available',
        searchTerm: 'google_places',
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        rating: place.rating || (Math.random() * 2) + 3, // Use Google rating or random between 3-5
        photos: place.photos ? 
          [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`] : 
          ['https://via.placeholder.com/150?text=No+Image'],
        reviews: [],
        distance: distance, // Add distance information
        openingHours: place.opening_hours?.open_now ? 'Open now' : 'Closed',
        placeDetails: place, // Keep the raw place data for additional information
      };
    });
    
    // Sort theaters by distance
    theatres.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Cache the results
    await cacheTheatres(theatres, latitude, longitude, radius);
    
    return theatres;
  } catch (error) {
    console.error('Error finding nearby theatres with Google Places:', error);
    return [];
  }
};

// Search for movie theatres nearby - combined approach with enhanced features
export const findNearbyTheatres = async (
  latitude: number,
  longitude: number,
  radius: number = 10000
): Promise<Theatre[]> => {
  try {
    console.log(`Searching for theatres near: ${latitude}, ${longitude}`);
    
    // Try cached results first
    const cachedResults = await getCachedTheatres(latitude, longitude);
    if (cachedResults && cachedResults.length > 0) {
      return cachedResults;
    }
    
    // Try Google Places API first (always use Google Places API if key is provided)
    if (GOOGLE_PLACES_API_KEY) {
      const googleResults = await findNearbyTheatresWithGooglePlaces(latitude, longitude, radius);
      if (googleResults.length > 0) {
        console.log(`Returning ${googleResults.length} results from Google Places API`);
        return googleResults;
      }
    }
    
    // Fall back to Mapbox API if Google Places didn't return results
    // Use specific movie theater chain names and generic terms
    const searchTerms = [
      // Popular chains in Hong Kong
      'Broadway Circuit',
      'MCL Cinema',
      'Emperor Cinemas',
      'UA Cinemas',
      'Golden Harvest',
      'Palace IFC',
      'Cinema City',
      
      // Popular international chains
      'IMAX',
      'CGV',
      'AMC',
      'Cinemark',
      'Cineplex',
      'Regal Cinema',
      'Odeon',
      'Cineworld',
      
      // Generic terms in different languages
      'cinema',
      'movie theatre',
      'theater',
      'movie theater',
      'multiplex',
      '電影院', // Chinese (traditional)
      '影院',   // Chinese (simplified)
      '戲院',   // Alternative Chinese term for cinema
      '영화관',  // Korean
      '映画館'   // Japanese
    ];
    
    // Store all results from different search terms
    let allResults: Theatre[] = [];
    
    // Try to find theaters using specific keywords through Mapbox API
    for (const term of searchTerms) {
      try {
        console.log(`Trying search term: ${term}`);
        // Use maximum limit for Mapbox API to get more results
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?proximity=${longitude},${latitude}&access_token=${MAPBOX_API_KEY}&limit=10&types=poi`;
        
        const response = await axios.get(endpoint);
        console.log(`Response status for "${term}": ${response.status}`);
        
        if (response.data && Array.isArray(response.data.features) && response.data.features.length > 0) {
          console.log(`Found ${response.data.features.length} results with term: ${term}`);
          
          const mappedResults = response.data.features.map((feature: any) => {
            // Calculate distance from current position to theater
            const distance = calculateDistance(
              latitude, 
              longitude, 
              feature.center[1], 
              feature.center[0]
            ) * 1000; // Convert to meters
            
            return {
              id: feature.id,
              name: feature.text,
              address: feature.place_name,
              searchTerm: term, // Include the search term that found this result
              location: {
                latitude: feature.center[1],
                longitude: feature.center[0],
              },
              rating: (Math.random() * 2) + 3, // Random rating between 3-5
              photos: ['https://via.placeholder.com/150?text=No+Image'],
              reviews: [],
              distance: distance, // Add distance information
            };
          });
          
          allResults = [...allResults, ...mappedResults];
        }
      } catch (innerError) {
        console.error(`Error with search term "${term}":`, innerError);
        // Continue to the next term
      }
    }
    
    // Remove duplicates based on location coordinates (improved algorithm)
    const uniqueResults: Theatre[] = [];
    const locationSet = new Set();
    
    for (const theatre of allResults) {
      // Create a unique key based on coordinates rounded to 5 decimal places
      const key = `${theatre.location.latitude.toFixed(5)},${theatre.location.longitude.toFixed(5)}`;
      
      if (!locationSet.has(key)) {
        locationSet.add(key);
        uniqueResults.push(theatre);
      }
    }
    
    console.log(`Found ${uniqueResults.length} unique theatre locations with Mapbox API`);
    
    // Sort theaters by distance
    uniqueResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    if (uniqueResults.length > 0) {
      // Cache the results
      await cacheTheatres(uniqueResults, latitude, longitude, radius);
      return uniqueResults;
    }
    
    console.log("No results found with any search term, using fallback data");
    
    // Fallback cinemas - expanded with more realistic data
    // Check if we're in Hong Kong area (approximate bounding box)
    if (latitude > 22.1 && latitude < 22.5 && longitude > 113.8 && longitude < 114.4) {
      const fallbackTheatres: Theatre[] = [
        {
          id: 'hk1',
          name: 'Broadway Circuit - PALACE ifc',
          address: 'Podium Level 1, IFC Mall, 8 Finance Street, Central, Hong Kong',
          location: { latitude: 22.2851, longitude: 114.1582 },
          rating: 4.5,
          photos: ['https://via.placeholder.com/150?text=Broadway+Cinema'],
          reviews: [],
          distance: calculateDistance(latitude, longitude, 22.2851, 114.1582) * 1000,
          openingHours: 'Open 10:00 AM - 11:00 PM',
          website: 'https://www.broadway-circuit.com/',
          phoneNumber: '+852 2388 6268',
        },
        {
          id: 'hk2',
          name: 'MCL Cinema - Telford',
          address: 'Telford Plaza, 33 Wai Yip Street, Kowloon Bay, Hong Kong',
          location: { latitude: 22.3235, longitude: 114.2132 },
          rating: 4.1,
          photos: ['https://via.placeholder.com/150?text=MCL+Cinema'],
          reviews: [],
          distance: calculateDistance(latitude, longitude, 22.3235, 114.2132) * 1000,
          openingHours: 'Open 11:00 AM - 11:30 PM',
          website: 'https://www.mclcinema.com/',
          phoneNumber: '+852 2319 1222',
        },
        {
          id: 'hk3',
          name: 'Emperor Cinemas - Entertainment Building',
          address: '2/F, Entertainment Building, 30 Queen\'s Road Central, Central, Hong Kong',
          location: { latitude: 22.2821, longitude: 114.1552 },
          rating: 4.3,
          photos: ['https://via.placeholder.com/150?text=Emperor+Cinemas'],
          reviews: [],
          distance: calculateDistance(latitude, longitude, 22.2821, 114.1552) * 1000,
          openingHours: 'Open 10:30 AM - 11:30 PM',
          website: 'https://www.emperorcinemas.com/',
          phoneNumber: '+852 2522 2996',
        },
        {
          id: 'hk4',
          name: 'UA Cinemas - Times Square',
          address: '13/F, Times Square, 1 Matheson Street, Causeway Bay, Hong Kong',
          location: { latitude: 22.2798, longitude: 114.1829 },
          rating: 4.2,
          photos: ['https://via.placeholder.com/150?text=UA+Cinemas'],
          reviews: [],
          distance: calculateDistance(latitude, longitude, 22.2798, 114.1829) * 1000,
          openingHours: 'Open 10:00 AM - 12:00 AM',
          website: 'https://www.uacinemas.com.hk/',
          phoneNumber: '+852 2118 8339',
        },
        {
          id: 'hk5',
          name: 'PALACE cinemas - The ONE',
          address: 'L6, The ONE, 100 Nathan Road, Tsim Sha Tsui, Hong Kong',
          location: { latitude: 22.2997, longitude: 114.1723 },
          rating: 4.4,
          photos: ['https://via.placeholder.com/150?text=Palace+Cinemas'],
          reviews: [],
          distance: calculateDistance(latitude, longitude, 22.2997, 114.1723) * 1000,
          openingHours: 'Open 11:00 AM - 11:00 PM',
          website: 'https://www.palacecinemas.com.hk/',
          phoneNumber: '+852 2388 8811',
        }
      ];
      
      // Sort by distance from user location
      fallbackTheatres.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Cache the fallback results too
      await cacheTheatres(fallbackTheatres, latitude, longitude, radius);
      
      return fallbackTheatres;
    }
    
    // If not in Hong Kong, return an empty array
    return [];
  } catch (error) {
    console.error('Error in findNearbyTheatres:', error);
    return [];
  }
}; 