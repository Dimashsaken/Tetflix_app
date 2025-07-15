import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { findNearbyTheatres, getDirection, calculateDistance, Theatre } from '../../app/utils/mapService';

// Types
interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface FilterOptions {
  maxDistance: number; // in meters
  minRating: number;
  openNow: boolean;
}

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  granted: boolean;
  error: string | null;
}

interface MapState {
  theatres: Theatre[];
  selectedTheatre: Theatre | null;
  region: MapRegion;
  userLocation: LocationState;
  isLoading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  showFilters: boolean;
  mapStyle: 'standard' | 'satellite' | 'hybrid';
  searchQuery: string;
  searchResults: Theatre[];
  isSearching: boolean;
  directions: any | null;
  showDirections: boolean;
  lastUpdateTime: number | null;
  cacheExpiry: number;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const initialState: MapState = {
  theatres: [],
  selectedTheatre: null,
  region: DEFAULT_REGION,
  userLocation: {
    coords: null,
    granted: false,
    error: null,
  },
  isLoading: false,
  error: null,
  filterOptions: {
    maxDistance: 10000, // 10km
    minRating: 0,
    openNow: false,
  },
  showFilters: false,
  mapStyle: 'standard',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  directions: null,
  showDirections: false,
  lastUpdateTime: null,
  cacheExpiry: 1000 * 60 * 60, // 1 hour
};

// Async thunks
export const requestLocationPermission = createAsyncThunk(
  'map/requestLocationPermission',
  async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      return true;
    } catch (error) {
      throw new Error('Failed to request location permission');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'map/getCurrentLocation',
  async (_, { dispatch }) => {
    try {
      await dispatch(requestLocationPermission());
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      throw new Error('Failed to get current location');
    }
  }
);

export const searchNearbyTheatres = createAsyncThunk(
  'map/searchNearbyTheatres',
  async (
    { latitude, longitude, radius = 10000 }: { latitude: number; longitude: number; radius?: number },
    { getState }
  ) => {
    const state = getState() as { map: MapState };
    const now = Date.now();
    
    // Check cache validity
    if (
      state.map.theatres.length > 0 &&
      state.map.lastUpdateTime &&
      now - state.map.lastUpdateTime < state.map.cacheExpiry
    ) {
      return state.map.theatres;
    }
    
    try {
      const theatres = await findNearbyTheatres(latitude, longitude, radius);
      return theatres;
    } catch (error) {
      throw new Error('Failed to search nearby theatres');
    }
  }
);

export const searchTheatresByQuery = createAsyncThunk(
  'map/searchTheatresByQuery',
  async ({ query, location }: { query: string; location: { latitude: number; longitude: number } }) => {
    try {
      // Implementation depends on your search service
      // For now, we'll filter existing theatres
      const theatres = await findNearbyTheatres(location.latitude, location.longitude, 50000);
      const filteredTheatres = theatres.filter(theatre =>
        theatre.name.toLowerCase().includes(query.toLowerCase()) ||
        theatre.address.toLowerCase().includes(query.toLowerCase())
      );
      return filteredTheatres;
    } catch (error) {
      throw new Error('Failed to search theatres');
    }
  }
);

export const getDirectionsToTheatre = createAsyncThunk(
  'map/getDirectionsToTheatre',
  async (
    { 
      origin, 
      destination 
    }: { 
      origin: { latitude: number; longitude: number }; 
      destination: { latitude: number; longitude: number } 
    }
  ) => {
    try {
      const directions = await getDirection(origin, destination);
      return directions;
    } catch (error) {
      throw new Error('Failed to get directions');
    }
  }
);

export const addTheatreReview = createAsyncThunk(
  'map/addTheatreReview',
  async ({ 
    theatreId, 
    review 
  }: { 
    theatreId: string; 
    review: { rating: number; text: string; author: string } 
  }) => {
    // In a real app, this would make an API call
    const newReview = {
      ...review,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    
    return { theatreId, review: newReview };
  }
);

// Create slice
const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setRegion: (state, action: PayloadAction<MapRegion>) => {
      state.region = action.payload;
    },
    setSelectedTheatre: (state, action: PayloadAction<Theatre | null>) => {
      state.selectedTheatre = action.payload;
    },
    setFilterOptions: (state, action: PayloadAction<Partial<FilterOptions>>) => {
      state.filterOptions = { ...state.filterOptions, ...action.payload };
    },
    toggleFilters: (state) => {
      state.showFilters = !state.showFilters;
    },
    setMapStyle: (state, action: PayloadAction<'standard' | 'satellite' | 'hybrid'>) => {
      state.mapStyle = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    setDirections: (state, action: PayloadAction<any>) => {
      state.directions = action.payload;
    },
    toggleDirections: (state) => {
      state.showDirections = !state.showDirections;
    },
    clearDirections: (state) => {
      state.directions = null;
      state.showDirections = false;
    },
    clearError: (state) => {
      state.error = null;
      state.userLocation.error = null;
    },
    updateTheatreRating: (state, action: PayloadAction<{ theatreId: string; rating: number }>) => {
      const theatre = state.theatres.find(t => t.id === action.payload.theatreId);
      if (theatre) {
        theatre.rating = action.payload.rating;
      }
      
      if (state.selectedTheatre?.id === action.payload.theatreId) {
        state.selectedTheatre.rating = action.payload.rating;
      }
    },
    resetMapState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Request location permission
    builder
      .addCase(requestLocationPermission.fulfilled, (state) => {
        state.userLocation.granted = true;
        state.userLocation.error = null;
      })
      .addCase(requestLocationPermission.rejected, (state, action) => {
        state.userLocation.granted = false;
        state.userLocation.error = action.error.message || 'Location permission denied';
      })
      
      // Get current location
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userLocation.coords = action.payload;
        state.userLocation.granted = true;
        state.userLocation.error = null;
        
        // Update region to user's location
        state.region = {
          ...state.region,
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
        };
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.userLocation.error = action.error.message || 'Failed to get location';
      })
      
      // Search nearby theatres
      .addCase(searchNearbyTheatres.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchNearbyTheatres.fulfilled, (state, action) => {
        state.isLoading = false;
        state.theatres = action.payload;
        state.lastUpdateTime = Date.now();
      })
      .addCase(searchNearbyTheatres.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to search theatres';
      })
      
      // Search theatres by query
      .addCase(searchTheatresByQuery.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchTheatresByQuery.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchTheatresByQuery.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Failed to search theatres';
      })
      
      // Get directions
      .addCase(getDirectionsToTheatre.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDirectionsToTheatre.fulfilled, (state, action) => {
        state.isLoading = false;
        state.directions = action.payload;
        state.showDirections = true;
      })
      .addCase(getDirectionsToTheatre.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to get directions';
      })
      
      // Add theatre review
      .addCase(addTheatreReview.fulfilled, (state, action) => {
        const { theatreId, review } = action.payload;
        const theatre = state.theatres.find(t => t.id === theatreId);
        
        if (theatre) {
          theatre.reviews = [review, ...theatre.reviews];
          
          // Update rating (average of all reviews)
          const totalRating = theatre.reviews.reduce((sum, r) => sum + r.rating, 0);
          theatre.rating = parseFloat((totalRating / theatre.reviews.length).toFixed(1));
        }
        
        // Update selected theatre if it matches
        if (state.selectedTheatre?.id === theatreId) {
          state.selectedTheatre.reviews = [review, ...state.selectedTheatre.reviews];
          const totalRating = state.selectedTheatre.reviews.reduce((sum, r) => sum + r.rating, 0);
          state.selectedTheatre.rating = parseFloat((totalRating / state.selectedTheatre.reviews.length).toFixed(1));
        }
      });
  },
});

export const {
  setRegion,
  setSelectedTheatre,
  setFilterOptions,
  toggleFilters,
  setMapStyle,
  setSearchQuery,
  clearSearchResults,
  setDirections,
  toggleDirections,
  clearDirections,
  clearError,
  updateTheatreRating,
  resetMapState,
} = mapSlice.actions;

export default mapSlice.reducer;

// Selectors
export const selectTheatres = (state: { map: MapState }) => {
  const { theatres, filterOptions } = state.map;
  
  return theatres.filter(theatre => {
    // Filter by minimum rating
    if (theatre.rating < filterOptions.minRating) return false;
    
    // Filter by distance (if user location is available)
    if (state.map.userLocation.coords) {
      const distance = calculateDistance(
        state.map.userLocation.coords.latitude,
        state.map.userLocation.coords.longitude,
        theatre.coordinate.latitude,
        theatre.coordinate.longitude
      );
      if (distance > filterOptions.maxDistance) return false;
    }
    
    // Filter by open now (if supported)
    if (filterOptions.openNow && !theatre.isOpen) return false;
    
    return true;
  });
};

export const selectSelectedTheatre = (state: { map: MapState }) => state.map.selectedTheatre;
export const selectMapRegion = (state: { map: MapState }) => state.map.region;
export const selectUserLocation = (state: { map: MapState }) => state.map.userLocation;
export const selectMapLoading = (state: { map: MapState }) => state.map.isLoading;
export const selectMapError = (state: { map: MapState }) => state.map.error;
export const selectFilterOptions = (state: { map: MapState }) => state.map.filterOptions;
export const selectShowFilters = (state: { map: MapState }) => state.map.showFilters;
export const selectMapStyle = (state: { map: MapState }) => state.map.mapStyle;
export const selectSearchQuery = (state: { map: MapState }) => state.map.searchQuery;
export const selectSearchResults = (state: { map: MapState }) => state.map.searchResults;
export const selectIsSearching = (state: { map: MapState }) => state.map.isSearching;
export const selectDirections = (state: { map: MapState }) => state.map.directions;
export const selectShowDirections = (state: { map: MapState }) => state.map.showDirections;
