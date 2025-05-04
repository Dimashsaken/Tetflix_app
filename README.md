# Movie App

A modern mobile application built with React Native and Expo that allows users to discover, search, and manage their favorite movies. The app provides a seamless experience for movie enthusiasts to explore movies, view detailed information, find nearby theaters, and maintain a personal watchlist.

## About
Movie App is your solution for discovering and tracking movies. Browse popular films, search with filters, save favorites to your watchlist, and find movie theaters near you.

## Features

### 1. Movie Discovery
- **Home Screen**: Browse movies categorized by Popular, Top-Rated, and Trending
- **Category Browsing**: Horizontal scrolling lists for each movie category
- **Load More**: Automatically load additional movies as you scroll to the end of lists
- **Loading States**: Loading indicators when fetching content

### 2. Movie Search
- **Text Search**: Search for movies by title
- **Search History**: View and clear your recent searches
- **Basic Filters**:
  - By Genre
  - By Release Year range
  - By Minimum Rating
- **Sort Options**: Sort results by:
  - Popularity
  - Release Date
  - Rating
  - Title
- **View Toggle**: Switch between list and grid views
- **Trending Suggestions**: View trending movies when search is empty

### 3. Movie Theater Locator
- **Location-Based**: Find theaters near your current location
- **Map View**: View theaters as markers on Google Maps
- **Theater Search**: Filter theaters by name
- **Distance Filter**: Set maximum distance to search for theaters
- **Rating Filter**: Filter theaters by minimum rating
- **Open Now Filter**: Option to show only currently open theaters
- **Theater Details**:
  - Name and address
  - Distance from current location
  - Rating
- **User Actions**:
  - Get directions to theater
  - Call theater (if phone number available)
  - Visit theater website (if available)
- **Map Controls**:
  - Change map type (standard, satellite, hybrid)
  - Return to current location
  - Search theaters in visible area

### 4. Movie Details
- **Basic Information**:
  - Title and release date
  - Rating
  - Overview/plot summary
  - Poster image
- **Watchlist Integration**: Add to or remove from watchlist

### 5. Watchlist
- **Save Movies**: Add movies to watch later
- **Remove Movies**: Remove movies from watchlist with one tap
- **Persistent Storage**: Watchlist saved to device storage
- **Quick Access**: View basic details and access full movie information

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router with Tab Navigation
- **State Management**: React hooks (useState, useEffect)
- **Data Storage**: AsyncStorage for local persistence
- **UI Components**: Native React Native components
- **Icons**: @expo/vector-icons and Lucide React Native
- **Maps**: react-native-maps for theater locations
- **Location**: expo-location for user positioning
- **Animations**: react-native-reanimated
- **Network**: Axios for API calls
- **Media**: expo-image-picker for photo uploads

## Project Structure

```
project/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Home screen with movie discovery
│   │   ├── search.tsx     # Search functionality with filters
│   │   ├── map.tsx        # Theater locator feature
│   │   └── watchlist.tsx  # Watchlist management
│   ├── movie/             # Movie-related screens
│   │   └── [id].tsx       # Individual movie details
│   ├── components/        # Reusable UI components
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   └── _layout.tsx        # Root layout configuration
├── assets/                # Static assets (images, fonts)
└── hooks/                 # Custom React hooks
```

## Getting Started

1. **Prerequisites**
   - Node.js (v18 or higher)
   - npm or yarn
   - Expo CLI

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Start the development server
   npx expo start
   ```

3. **Running the App**
   - Use Expo Go on your mobile device
   - Or run on iOS/Android simulators

## API Integration

The app uses:
- **The Movie Database (TMDB)**: For movie data and search
- **Google Places API**: For theater location data
- **Expo Location**: For getting user's current location

## Key Dependencies

- expo: ~52.0.46
- react: 18.3.1
- react-native: 0.76.9
- @react-navigation/bottom-tabs: ^7.2.0
- react-native-maps: ^1.18.0
- axios: ^1.8.4
- expo-location: ~18.0.10
- react-native-reanimated: ^3.16.1
- @react-native-async-storage/async-storage: 1.23.1
- expo-image-picker: ~16.0.6

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- The Movie Database (TMDB) API for movie data
- Google Places API for theater data
- Expo and React Native teams 
