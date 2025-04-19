# Movie App

A modern mobile application built with React Native and Expo that allows users to discover, search, and manage their favorite movies. The app provides a seamless experience for movie enthusiasts to explore movies, view detailed information, and maintain a personal watchlist.

## About
A movie app with features for finding movies, theaters, and managing your watchlist.

## Feature: Movie Theater Locator

We've enhanced the app with a new feature that helps users find movie theaters near their current location. This feature uses Google Places API for the most accurate results.

### How It Works
1. The app gets your current location
2. It searches for nearby movie theaters using Google Places API
3. Theaters are displayed as markers on the map with details like name, address and ratings
4. You can tap on a marker to see more information and add reviews or photos

## Features

### 1. Movie Discovery
- **Home Screen**: Browse through a curated list of movies with beautiful UI
- **Categories**: Explore movies by different categories (Trending, Popular, Upcoming)
- **Smooth Scrolling**: Horizontal and vertical scrolling with optimized performance
- **Pull-to-Refresh**: Update content with a simple pull gesture
- **Loading States**: Elegant loading animations and skeleton screens

### 2. Advanced Search
- **Real-time Search**: Instant results as you type
- **Search History**: Automatically saves your recent searches
- **Filters**: Filter results by:
  - Release Year
  - Rating
  - Genre
  - Language
- **Search Suggestions**: Intelligent suggestions based on your input
- **Clear Search**: Easy way to clear search history

### 3. Movie Details
- **Comprehensive Information**:
  - Title and Release Date
  - Plot Summary
  - Cast and Crew
  - Ratings and Reviews
  - Runtime
  - Genres
  - Production Companies
- **Media Gallery**:
  - Movie Poster
  - Backdrop Images
  - Trailers (if available)
- **Related Movies**: Discover similar movies you might like
- **Interactive Elements**:
  - Add to Watchlist button
  - Share functionality
  - Rating system

### 4. Watchlist Management
- **Personal Collection**: Save movies you want to watch later
- **Easy Organization**:
  - Add/Remove movies with a single tap
  - Sort by different criteria
  - Filter by watched/unwatched
- **Offline Access**: Access your watchlist even without internet
- **Sync Across Devices**: Watchlist syncs when you log in

### 5. User Experience
- **Smooth Animations**: Fluid transitions between screens
- **Responsive Design**: Works on all screen sizes
- **Dark/Light Mode**: Choose your preferred theme
- **Gesture Controls**: Intuitive swipe gestures
- **Offline Support**: Basic functionality available offline

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router with Bottom Tab Navigation
- **State Management**: React Native's built-in state management
- **Data Storage**: AsyncStorage for local data persistence
- **UI Components**: Custom components with Expo's built-in libraries
- **Icons**: @expo/vector-icons and Lucide icons
- **Maps Integration**: react-native-maps for location-based features
- **Animations**: react-native-reanimated for smooth animations
- **Network Requests**: Axios for API calls

## Project Structure

```
project/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Home screen with movie discovery
│   │   ├── search.tsx     # Search functionality with filters
│   │   └── watchlist.tsx  # Watchlist management
│   ├── movie/             # Movie-related screens
│   │   └── [id].tsx      # Individual movie details
│   └── _layout.tsx        # Root layout configuration
├── assets/                # Static assets (images, fonts)
├── hooks/                 # Custom React hooks
└── components/            # Reusable UI components
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
   npm run dev
   ```

3. **Running the App**
   - Use Expo Go on your mobile device
   - Or run on iOS/Android simulators

## Development

### Key Dependencies

- expo: ~52.0.42
- react: 18.3.1
- react-native: 0.76.9
- @react-navigation/bottom-tabs: ^7.2.0
- axios: ^1.8.4
- react-native-reanimated: ^3.16.7

### Code Organization

The project follows a modular structure:
- **Components**: Reusable UI elements
- **Hooks**: Custom React hooks for shared logic
- **Screens**: Main application screens
- **Navigation**: Routing and navigation configuration
- **Assets**: Static resources

### Best Practices

- TypeScript for type safety
- Component-based architecture
- Responsive design principles
- Performance optimization
- Clean code practices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- The Movie Database (TMDB) API for movie data
- Expo team for the amazing framework
- React Native community for continuous support 