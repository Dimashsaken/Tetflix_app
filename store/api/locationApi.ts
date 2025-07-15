import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Theatre } from '../../app/utils/mapService';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = "AIzaSyATFpPHA-JslMWSknrsKMWdBc_IPY9ZJPk";
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Types
export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
}

export interface NearbySearchParams {
  location: string; // "latitude,longitude"
  radius: number;
  type?: string;
  keyword?: string;
  name?: string;
  minprice?: number;
  maxprice?: number;
  opennow?: boolean;
  pagetoken?: string;
}

export interface TextSearchParams {
  query: string;
  location?: string;
  radius?: number;
  type?: string;
  minprice?: number;
  maxprice?: number;
  opennow?: boolean;
  pagetoken?: string;
}

export interface PlaceSearchResponse {
  results: PlaceSearchResult[];
  next_page_token?: string;
  status: string;
}

export interface PlaceDetailsResponse {
  result: PlaceDetailsResult;
  status: string;
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      steps: Array<{
        html_instructions: string;
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        polyline: {
          points: string;
        };
      }>;
    }>;
    overview_polyline: {
      points: string;
    };
    summary: string;
  }>;
  status: string;
}

export interface DirectionsParams {
  origin: string;
  destination: string;
  mode?: 'driving' | 'walking' | 'transit' | 'bicycling';
  avoid?: string;
  alternatives?: boolean;
  departure_time?: number;
  arrival_time?: number;
}

// Create API slice
export const locationApi = createApi({
  reducerPath: 'locationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: GOOGLE_PLACES_BASE_URL,
  }),
  tagTypes: ['Places', 'PlaceDetails', 'Directions'],
  endpoints: (builder) => ({
    // Nearby search for places
    nearbySearch: builder.query<PlaceSearchResponse, NearbySearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams({
          location: params.location,
          radius: params.radius.toString(),
          key: GOOGLE_PLACES_API_KEY,
        });
        
        if (params.type) searchParams.append('type', params.type);
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.name) searchParams.append('name', params.name);
        if (params.minprice !== undefined) searchParams.append('minprice', params.minprice.toString());
        if (params.maxprice !== undefined) searchParams.append('maxprice', params.maxprice.toString());
        if (params.opennow) searchParams.append('opennow', 'true');
        if (params.pagetoken) searchParams.append('pagetoken', params.pagetoken);
        
        return `/nearbysearch/json?${searchParams.toString()}`;
      },
      providesTags: ['Places'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { pagetoken, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.pagetoken) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.pagetoken !== previousArg?.pagetoken;
      },
    }),
    
    // Text search for places
    textSearch: builder.query<PlaceSearchResponse, TextSearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams({
          query: params.query,
          key: GOOGLE_PLACES_API_KEY,
        });
        
        if (params.location) searchParams.append('location', params.location);
        if (params.radius) searchParams.append('radius', params.radius.toString());
        if (params.type) searchParams.append('type', params.type);
        if (params.minprice !== undefined) searchParams.append('minprice', params.minprice.toString());
        if (params.maxprice !== undefined) searchParams.append('maxprice', params.maxprice.toString());
        if (params.opennow) searchParams.append('opennow', 'true');
        if (params.pagetoken) searchParams.append('pagetoken', params.pagetoken);
        
        return `/textsearch/json?${searchParams.toString()}`;
      },
      providesTags: ['Places'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { pagetoken, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.pagetoken) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.pagetoken !== previousArg?.pagetoken;
      },
    }),
    
    // Get place details
    getPlaceDetails: builder.query<PlaceDetailsResponse, string>({
      query: (placeId) => {
        const searchParams = new URLSearchParams({
          place_id: placeId,
          key: GOOGLE_PLACES_API_KEY,
          fields: 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,url,geometry,rating,user_ratings_total,reviews,opening_hours,photos,types',
        });
        
        return `/details/json?${searchParams.toString()}`;
      },
      providesTags: (result, error, placeId) => [{ type: 'PlaceDetails', id: placeId }],
    }),
    
    // Get directions
    getDirections: builder.query<DirectionsResult, DirectionsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams({
          origin: params.origin,
          destination: params.destination,
          key: GOOGLE_PLACES_API_KEY,
        });
        
        if (params.mode) searchParams.append('mode', params.mode);
        if (params.avoid) searchParams.append('avoid', params.avoid);
        if (params.alternatives) searchParams.append('alternatives', 'true');
        if (params.departure_time) searchParams.append('departure_time', params.departure_time.toString());
        if (params.arrival_time) searchParams.append('arrival_time', params.arrival_time.toString());
        
        return `https://maps.googleapis.com/maps/api/directions/json?${searchParams.toString()}`;
      },
      providesTags: ['Directions'],
    }),
    
    // Search for movie theaters specifically
    searchMovieTheaters: builder.query<PlaceSearchResponse, {
      location: string;
      radius: number;
      pagetoken?: string;
    }>({
      query: ({ location, radius, pagetoken }) => {
        const searchParams = new URLSearchParams({
          location,
          radius: radius.toString(),
          type: 'movie_theater',
          key: GOOGLE_PLACES_API_KEY,
        });
        
        if (pagetoken) searchParams.append('pagetoken', pagetoken);
        
        return `/nearbysearch/json?${searchParams.toString()}`;
      },
      providesTags: ['Places'],
      serializeQueryArgs: ({ queryArgs }) => {
        const { pagetoken, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.pagetoken) {
          return newItems;
        }
        return {
          ...newItems,
          results: [...currentCache.results, ...newItems.results],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.pagetoken !== previousArg?.pagetoken;
      },
    }),
    
    // Get place photo
    getPlacePhoto: builder.query<Blob, {
      photoReference: string;
      maxwidth?: number;
      maxheight?: number;
    }>({
      query: ({ photoReference, maxwidth = 400, maxheight = 400 }) => {
        const searchParams = new URLSearchParams({
          photoreference: photoReference,
          maxwidth: maxwidth.toString(),
          maxheight: maxheight.toString(),
          key: GOOGLE_PLACES_API_KEY,
        });
        
        return `/photo?${searchParams.toString()}`;
      },
      providesTags: (result, error, { photoReference }) => [{ type: 'Places', id: `photo-${photoReference}` }],
    }),
    
    // Autocomplete for places
    autocomplete: builder.query<{
      predictions: Array<{
        description: string;
        place_id: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
        types: string[];
      }>;
      status: string;
    }, {
      input: string;
      location?: string;
      radius?: number;
      types?: string;
    }>({
      query: ({ input, location, radius, types }) => {
        const searchParams = new URLSearchParams({
          input,
          key: GOOGLE_PLACES_API_KEY,
        });
        
        if (location) searchParams.append('location', location);
        if (radius) searchParams.append('radius', radius.toString());
        if (types) searchParams.append('types', types);
        
        return `/autocomplete/json?${searchParams.toString()}`;
      },
      providesTags: ['Places'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useNearbySearchQuery,
  useTextSearchQuery,
  useGetPlaceDetailsQuery,
  useGetDirectionsQuery,
  useSearchMovieTheatersQuery,
  useGetPlacePhotoQuery,
  useAutocompleteQuery,
  useLazyNearbySearchQuery,
  useLazyTextSearchQuery,
  useLazyGetPlaceDetailsQuery,
  useLazyGetDirectionsQuery,
  useLazySearchMovieTheatersQuery,
  useLazyAutocompleteQuery,
} = locationApi;

// Export manual query triggers
export const {
  nearbySearch,
  textSearch,
  getPlaceDetails,
  getDirections,
  searchMovieTheaters,
  getPlacePhoto,
  autocomplete,
} = locationApi.endpoints;

// Utility functions to convert Google Places results to Theatre objects
export const convertPlaceToTheatre = (place: PlaceSearchResult): Theatre => {
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    coordinate: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    },
    rating: place.rating || 0,
    isOpen: place.opening_hours?.open_now || false,
    distance: 0, // This should be calculated based on user's location
    phone: '', // Will be populated when fetching details
    website: '', // Will be populated when fetching details
    reviews: [], // Will be populated when fetching details
    showtimes: [], // Custom data, not from Google Places
    movies: [], // Custom data, not from Google Places
    photos: place.photos?.map(photo => ({
      id: photo.photo_reference,
      url: `${GOOGLE_PLACES_BASE_URL}/photo?photoreference=${photo.photo_reference}&maxwidth=400&key=${GOOGLE_PLACES_API_KEY}`,
      width: photo.width,
      height: photo.height,
    })) || [],
  };
};

export const convertPlaceDetailsToTheatre = (placeDetails: PlaceDetailsResult): Theatre => {
  return {
    id: placeDetails.place_id,
    name: placeDetails.name,
    address: placeDetails.formatted_address,
    coordinate: {
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
    },
    rating: placeDetails.rating || 0,
    isOpen: placeDetails.opening_hours?.open_now || false,
    distance: 0, // This should be calculated based on user's location
    phone: placeDetails.formatted_phone_number || '',
    website: placeDetails.website || '',
    reviews: placeDetails.reviews?.map(review => ({
      id: review.time.toString(),
      author: review.author_name,
      rating: review.rating,
      text: review.text,
      date: new Date(review.time * 1000).toISOString(),
    })) || [],
    showtimes: [], // Custom data, not from Google Places
    movies: [], // Custom data, not from Google Places
    photos: placeDetails.photos?.map(photo => ({
      id: photo.photo_reference,
      url: `${GOOGLE_PLACES_BASE_URL}/photo?photoreference=${photo.photo_reference}&maxwidth=400&key=${GOOGLE_PLACES_API_KEY}`,
      width: photo.width,
      height: photo.height,
    })) || [],
  };
};
