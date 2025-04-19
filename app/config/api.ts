import Constants from 'expo-constants';
import React from 'react';

export const TMDB_API_KEY = Constants.expoConfig?.extra?.TMDB_API_KEY;
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