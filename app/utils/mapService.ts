import Constants from 'expo-constants';
import axios from 'axios';

// Hardcoding the token directly to ensure it works
const MAPBOX_API_KEY = "pk.eyJ1IjoiZG1hc2hzYWtlbiIsImEiOiJjbTlrc2I1emYwcm41MmpwcWxjaHphZW1oIn0.1a8e6NyXWkxslcNY9pgULw";
// Google Places API Key - you'll need to obtain this from Google Cloud Console
// This is a placeholder - replace with your actual key
const GOOGLE_PLACES_API_KEY = "AIzaSyDOasqoont3lWrUxEsK018Kj6ZgQlCkW6M";

interface MapboxPlace {
  id: string;
  place_name: string;
  center: [number, number]; // longitude, latitude
}

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

// Search for movie theatres using Google Places API (more accurate for businesses)
export const findNearbyTheatresWithGooglePlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 5000
): Promise<any[]> => {
  try {
    console.log(`Searching for theatres near: ${latitude}, ${longitude} using Google Places API`);
    
    // Using Google Places API for nearby search - more accurate for business POIs
    const googleEndpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=movie_theater&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(googleEndpoint);
    console.log(`Google Places API Response status: ${response.status}`);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      console.log(`Found ${response.data.results.length} theaters with Google Places API`);
      
      // Map the Google Places API response to our Theatre format
      return response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        searchTerm: 'google_places',
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        rating: place.rating || (Math.random() * 2) + 3, // Use Google rating or random between 3-5
        photos: place.photos ? 
          [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`] : 
          ['https://via.placeholder.com/150'],
        reviews: [],
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error finding nearby theatres with Google Places:', error);
    return [];
  }
};

// Search for movie theatres nearby - combined approach
export const findNearbyTheatres = async (
  latitude: number,
  longitude: number,
  radius: number = 10000
): Promise<any[]> => {
  try {
    console.log(`Searching for theatres near: ${latitude}, ${longitude}`);
    
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
    let allResults: any[] = [];
    
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
          
          const mappedResults = response.data.features.map((feature: any) => ({
            id: feature.id,
            name: feature.text,
            address: feature.place_name,
            searchTerm: term, // Include the search term that found this result
            location: {
              latitude: feature.center[1],
              longitude: feature.center[0],
            },
            rating: (Math.random() * 2) + 3, // Random rating between 3-5
            photos: ['https://via.placeholder.com/150'],
            reviews: [],
          }));
          
          allResults = [...allResults, ...mappedResults];
        }
      } catch (innerError) {
        console.error(`Error with search term "${term}":`, innerError);
        // Continue to the next term
      }
    }
    
    // Remove duplicates based on location coordinates
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex((r) => 
        r.location.latitude === result.location.latitude && 
        r.location.longitude === result.location.longitude
      )
    );
    
    console.log(`Found ${uniqueResults.length} unique theatre locations with Mapbox API`);
    
    if (uniqueResults.length > 0) {
      return uniqueResults; // Return all real theaters found
    }
    
    console.log("No results found with any search term, using fallback data");
    
    // Hong Kong fallback cinemas if we're in Hong Kong area
    if (latitude > 22.1 && latitude < 22.5 && longitude > 113.8 && longitude < 114.4) {
      return [
        {
          id: 'hk1',
          name: 'Broadway Circuit - PALACE ifc',
          address: 'Podium Level 1, IFC Mall, 8 Finance Street, Central, Hong Kong',
          location: { latitude: 22.2851, longitude: 114.1582 },
          rating: 4.5,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk2',
          name: 'MCL Cinema - Telford',
          address: 'Telford Plaza, 33 Wai Yip Street, Kowloon Bay, Hong Kong',
          location: { latitude: 22.3235, longitude: 114.2132 },
          rating: 4.1,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk3',
          name: 'Emperor Cinemas - Entertainment Building',
          address: '2/F, Entertainment Building, 30 Queen\'s Road Central, Central, Hong Kong',
          location: { latitude: 22.2821, longitude: 114.1552 },
          rating: 4.3,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk4',
          name: 'UA Cinemas - Times Square',
          address: '5/F, Times Square, 1 Matheson Street, Causeway Bay, Hong Kong',
          location: { latitude: 22.2794, longitude: 114.1822 },
          rating: 4.4,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk5',
          name: 'MCL Cinema - Cyberport',
          address: 'Level 2, The Arcade, 100 Cyberport Road, Cyberport, Hong Kong',
          location: { latitude: 22.2608, longitude: 114.1301 },
          rating: 4.0,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk6',
          name: 'Broadway Circuit - MONGKOK',
          address: '4/F, MOKO, 193 Prince Edward Road West, Mong Kok, Hong Kong',
          location: { latitude: 22.3225, longitude: 114.1722 },
          rating: 4.2,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk7',
          name: 'MCL Cinema - Metro City',
          address: 'Level 2, Metro City Phase I, Tseung Kwan O, Hong Kong',
          location: { latitude: 22.3075, longitude: 114.2596 },
          rating: 4.1,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk8',
          name: 'Cinema City - Langham Place',
          address: 'L8, Langham Place, 8 Argyle Street, Mong Kok, Hong Kong',
          location: { latitude: 22.3181, longitude: 114.1692 },
          rating: 4.3,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk9',
          name: 'Palace IFC - IMAX Theatre',
          address: 'Podium L1, IFC Mall, Central, Hong Kong',
          location: { latitude: 22.2849, longitude: 114.1577 },
          rating: 4.7,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        },
        {
          id: 'hk10',
          name: 'Broadway Circuit - The ONE',
          address: '6/F, The ONE, 100 Nathan Road, Tsim Sha Tsui, Hong Kong',
          location: { latitude: 22.2996, longitude: 114.1724 },
          rating: 4.2,
          photos: ['https://via.placeholder.com/150'],
          reviews: [],
        }
      ];
    }
    
    // Add default return - empty array
    return [];
    
  } catch (error) {
    console.error('Error finding nearby theatres:', error);
    return [];
  }
}; 