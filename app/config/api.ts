import Constants from 'expo-constants';
import React from 'react';

// Use hardcoded API key for now (should be moved to environment variables)
export const TMDB_API_KEY = Constants.expoConfig?.extra?.TMDB_API_KEY || '3e3f0a46d6f2abc8e557d06b3fc21a77';

// Debug logging
console.log('📱 API Configuration Debug:');
console.log('- Constants.expoConfig exists:', !!Constants.expoConfig);
console.log('- Constants.expoConfig.extra exists:', !!Constants.expoConfig?.extra);
console.log('- TMDB_API_KEY value:', TMDB_API_KEY ? 'Found' : 'Not found');
console.log('- TMDB_API_KEY length:', TMDB_API_KEY?.length || 0);

// Validate API key immediately
if (!TMDB_API_KEY) {
  console.error('❌ TMDB API key is missing! Please check your app.json configuration.');
  console.error('Expected key: TMDB_API_KEY in extra section');
} else {
  console.log('✅ TMDB API key loaded successfully');
}

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const endpoints = {
  movieDetails: (id: string | number) => `${TMDB_BASE_URL}/movie/${id}`,
  movieCredits: (id: string | number) => `${TMDB_BASE_URL}/movie/${id}/credits`,
  movieRecommendations: (id: string | number) => `${TMDB_BASE_URL}/movie/${id}/recommendations`,
  movieVideos: (id: string | number) => `${TMDB_BASE_URL}/movie/${id}/videos`,
};

// Default export to satisfy the route requirements
export default function ApiConfig() {
  return null;
} 