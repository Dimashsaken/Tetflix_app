// API service for handling secure API requests
import axios from 'axios';
import Constants from 'expo-constants';

// Use environment variables (this is just a placeholder - in a real app, you would not include these at all)
// In a production app, these would be handled by a backend service
const API_CONFIG = {
  BASE_URL: 'https://your-backend-api.com', // Replace with your actual backend URL
};

// This function would communicate with your own backend that proxies the API requests
// Your backend would store and use the API keys securely
export const findNearbyTheatres = async (latitude: number, longitude: number, radius: number = 10000) => {
  try {
    // In a real implementation, you would call your own backend API
    // which would then make the Google Places or Mapbox API calls with proper security
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/theaters`, {
      params: {
        latitude,
        longitude,
        radius,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error finding nearby theatres:', error);
    throw error;
  }
};

// Other API methods would follow the same pattern of calling your secure backend
export const getDirections = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
  try {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/directions`, {
      params: {
        startLat,
        startLng,
        endLat,
        endLng,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
};

// Placeholder for search places API
export const searchPlaces = async (query: string) => {
  try {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/places/search`, {
      params: {
        query,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
}; 