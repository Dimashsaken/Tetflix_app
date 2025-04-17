import Constants from 'expo-constants';
import axios from 'axios';

// Hardcoding the token directly to ensure it works
const MAPBOX_API_KEY = "pk.eyJ1IjoiZG1hc2hzYWtlbiIsImEiOiJjbTlrc2I1emYwcm41MmpwcWxjaHphZW1oIn0.1a8e6NyXWkxslcNY9pgULw";

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
    )}.json?access_token=${MAPBOX_API_KEY}&limit=5&types=place,poi`;
    
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

// Search for movie theatres nearby
export const findNearbyTheatres = async (
  latitude: number,
  longitude: number,
  radius: number = 10000
): Promise<any[]> => {
  try {
    console.log(`Searching for theatres near: ${latitude}, ${longitude}`);
    
    // Use specific movie theater chain names and generic terms
    const searchTerms = [
      // Popular chains in Hong Kong
      'Broadway Circuit',
      'MCL Cinema',
      'Emperor Cinemas',
      'UA Cinemas',
      'Golden Harvest',
      
      // Popular international chains
      'IMAX',
      'CGV',
      'AMC',
      'Cinemark',
      
      // Generic terms in different languages
      'cinema',
      'movie theatre',
      'theater',
      'movie theater',
      '電影院', // Chinese (traditional)
      '影院',   // Chinese (simplified)
      '戲院',   // Alternative Chinese term for cinema
      '영화관',  // Korean
      '映画館'   // Japanese
    ];
    
    // Store all results from different search terms
    let allResults: any[] = [];
    
    // We'll collect results from all search terms
    for (const term of searchTerms) {
      try {
        console.log(`Trying search term: ${term}`);
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?proximity=${longitude},${latitude}&access_token=${MAPBOX_API_KEY}&limit=5&types=poi`;
        
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
    
    console.log(`Found ${uniqueResults.length} unique theatre locations`);
    
    if (uniqueResults.length > 0) {
      return uniqueResults;
    }
    
    console.log("No results found with any search term");
    
    // Hong Kong fallback cinemas if we're in Hong Kong area
    if (latitude > 22.1 && latitude < 22.5 && longitude > 113.8 && longitude < 114.4) {
      console.log("Using Hong Kong fallback cinema data");
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
        }
      ];
    }
    
    // New York fallback data
    return [
      {
        id: 'ny1',
        name: 'AMC Empire 25',
        address: '234 W 42nd St, New York, NY 10036',
        location: { latitude: 40.7565, longitude: -73.9878 },
        rating: 4.5,
        photos: ['https://via.placeholder.com/150'],
        reviews: [],
      },
      {
        id: 'ny2',
        name: 'Regal Union Square',
        address: '850 Broadway, New York, NY 10003',
        location: { latitude: 40.7353, longitude: -73.9906 },
        rating: 4.2,
        photos: ['https://via.placeholder.com/150'],
        reviews: [],
      },
      {
        id: 'ny3',
        name: 'Cinemark Theatre',
        address: '625 Broadway, New York, NY 10012',
        location: { latitude: 40.7312, longitude: -73.9829 },
        rating: 3.8,
        photos: ['https://via.placeholder.com/150'],
        reviews: [],
      },
      {
        id: 'ny4',
        name: 'IMAX AMC Lincoln Square',
        address: '1998 Broadway, New York, NY 10023',
        location: { latitude: 40.7751, longitude: -73.9815 },
        rating: 4.7,
        photos: ['https://via.placeholder.com/150'],
        reviews: [],
      }
    ];
  } catch (error) {
    console.error('Error finding nearby theatres:', error);
    return [];
  }
}; 