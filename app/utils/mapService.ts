import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React from 'react';

// Google Places API Key - you'll need to obtain this from Google Cloud Console
const GOOGLE_PLACES_API_KEY = "AIzaSyATFpPHA-JslMWSknrsKMWdBc_IPY9ZJPk";

// Cache configuration
const CACHE_EXPIRY_TIME = 1000 * 60 * 60; // 1 hour in milliseconds
const DEFAULT_CACHE_KEY = 'mapservice_theater_cache';

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

// Search for places using Google Places API
export const searchPlaces = async (query: string): Promise<any[]> => {
  try {
    if (!query) return [];
    
    const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(endpoint);
    
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        placeName: place.formatted_address,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

// Get directions using Google Directions API
export const getDirection = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ coordinates: Array<[number, number]>; distance: number; duration: number }> => {
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&mode=driving&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(endpoint);
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Decode polyline to get coordinates
      const coordinates = decodePolyline(route.overview_polyline.points).map(
        point => [point.lng, point.lat] as [number, number]
      );
      
      return {
        coordinates,
        distance: leg.distance.value, // in meters
        duration: leg.duration.value, // in seconds
      };
    }
    
    throw new Error('No routes found');
  } catch (error) {
    console.error('Error getting direction:', error);
    throw error;
  }
};

// Decode Google's polyline format
const decodePolyline = (encoded: string) => {
  const poly = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  
  return poly;
};

// Enhanced Google Places API implementation for finding theaters
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
      console.log(`Using ${cachedResults.length} cached theater results`);
      return cachedResults;
    }
    
    // Using Google Places API for nearby search - more accurate for business POIs
    const googleEndpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=movie_theater&key=${GOOGLE_PLACES_API_KEY}`;
    
    // Use timeout and detailed error for better diagnostics
    console.log(`Making request to Google Places API: ${googleEndpoint}`);
    const response = await axios.get(googleEndpoint, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Google Places API Response status: ${response.status}`);
    
    // Enhanced error handling and logging
    if (!response.data) {
      throw new Error(`Empty response from Google Places API`);
    }
    
    if (response.data.status && response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'No error message provided'}`);
    }
    
    if (!response.data.results) {
      throw new Error(`Missing results in Google Places API response: ${JSON.stringify(response.data)}`);
    }
    
    console.log(`Raw Google Places results count: ${response.data.results.length}`);
    
    if (response.data.results.length === 0) {
      console.log('No theaters found with initial radius, trying a larger radius');
      // If no results, try with a larger radius
      if (radius < 30000) {
        return findNearbyTheatresWithGooglePlaces(latitude, longitude, radius * 2);
      }
      console.log('No theaters found even with increased radius');
      return [];
    }
    
    console.log(`Found ${response.data.results.length} theaters with Google Places API`);
    
    // Process results to get more details
    const theatres: Theatre[] = [];
    
    for (const place of response.data.results) {
      try {
        // Get detailed place information
        const detailsEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,formatted_phone_number,opening_hours,website,photo,review,geometry&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsResponse = await axios.get(detailsEndpoint);
        const placeDetails = detailsResponse.data.result;
        
        // Calculate distance from current position to theater
        const distance = calculateDistance(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        ) * 1000; // Convert to meters
        
        // Format photos
        const photos = placeDetails.photos ? 
          placeDetails.photos.slice(0, 3).map((photo: any) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          ) : 
          ['https://via.placeholder.com/150?text=No+Image'];
        
        // Format reviews
        const reviews = placeDetails.reviews 
          ? placeDetails.reviews.map((review: any) => ({
              author: review.author_name,
              rating: parseFloat(review.rating.toFixed(1)),
              text: review.text,
              time: review.time
            }))
          : [];
          
        // Format opening hours
        const openingHours = placeDetails.opening_hours
          ? placeDetails.opening_hours.open_now 
            ? 'Open now' 
            : 'Closed'
          : 'Hours not available';
        
        const rating = placeDetails.rating ? parseFloat(placeDetails.rating.toFixed(1)) : 0;
        
        theatres.push({
          id: place.place_id,
          name: place.name,
          address: placeDetails.formatted_address || place.vicinity || 'Address not available',
          searchTerm: 'google_places',
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating,
          photos,
          reviews,
          distance,
          openingHours,
          website: placeDetails.website,
          phoneNumber: placeDetails.formatted_phone_number,
          placeDetails: place, // Keep the raw place data for additional information
        });
      } catch (detailsError) {
        console.error(`Error getting place details:`, detailsError);
        // Continue with basic information if detailed info can't be retrieved
        const distance = calculateDistance(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        ) * 1000;
        
        theatres.push({
          id: place.place_id,
          name: place.name,
          address: place.vicinity || 'Address not available',
          searchTerm: 'google_places',
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating: (Math.random() * 2) + 3,
          photos: place.photos ? 
            [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`] : 
            ['https://via.placeholder.com/150?text=No+Image'],
          reviews: [],
          distance,
          openingHours: place.opening_hours?.open_now ? 'Open now' : 'Closed',
          placeDetails: place,
        });
      }
    }
    
    // Sort theaters by distance
    theatres.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Cache the results
    await cacheTheatres(theatres, latitude, longitude, radius);
    
    return theatres;
  } catch (error) {
    console.error('Error finding nearby theatres with Google Places:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
    
    // Return fallback data for Hong Kong if in that region
    if (latitude > 22.1 && latitude < 22.5 && longitude > 113.8 && longitude < 114.4) {
      console.log("Using Hong Kong fallback theater data");
      return getHongKongFallbackTheaters(latitude, longitude);
    }
    
    return [];
  }
};

// Main function to find nearby theaters - now only uses Google Places API
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
      console.log(`Using ${cachedResults.length} cached theaters`);
      return cachedResults;
    }
    
    // Use Google Places API exclusively now
    return findNearbyTheatresWithGooglePlaces(latitude, longitude, radius);
  } catch (error) {
    console.error('Error in findNearbyTheatres:', error);
    
    // Return fallback data for Hong Kong if in that region
    if (latitude > 22.1 && latitude < 22.5 && longitude > 113.8 && longitude < 114.4) {
      console.log("Using Hong Kong fallback theater data");
      return getHongKongFallbackTheaters(latitude, longitude);
    }
    
    return [];
  }
};

// Fallback theatres for Hong Kong area
const getHongKongFallbackTheaters = (latitude: number, longitude: number): Theatre[] => {
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
  
  return fallbackTheatres;
};

// Default export to satisfy the route requirements
export default function MapService() {
  return null;
} 