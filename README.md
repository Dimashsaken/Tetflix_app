# Tetflix - Netflix-Inspired Movie Discovery App

A React Native + Expo movie discovery app with AWS Amplify backend, Cognito authentication, and Redux state management.

## 🎬 Features

- **Movie Discovery**: Browse trending, popular, and upcoming movies
- **Search**: Find movies by title, genre, or cast
- **Watchlist**: Save movies to your personal watchlist (synced to cloud)
- **User Authentication**: Secure signup/signin with AWS Cognito
- **Offline Support**: View cached data when offline
- **Cross-Device Sync**: Access your data from any device

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- AWS Account (for Cognito setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tetflix_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # AWS Cognito Configuration
   EXPO_PUBLIC_AWS_CLIENT_ID=your_cognito_client_id
   EXPO_PUBLIC_AWS_USER_POOL_ID=your_cognito_user_pool_id
   EXPO_PUBLIC_AWS_REGION=us-east-1
   
   # TMDB API (for movie data)
   EXPO_PUBLIC_TMDB_API_KEY=3e3f0a46d6f2abc8e557d06b3fc21a77
   ```

   **To get your AWS Cognito credentials:**
   - Go to AWS Console → Cognito
   - Find your User Pool ID in the User Pool settings
   - Find your Client ID in the App clients tab

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 🏗️ Architecture

### Current Implementation
- **Frontend**: React Native + Expo
- **Authentication**: AWS Cognito (email/password)
- **State Management**: React Context (migrating to Redux)
- **Navigation**: Expo Router
- **Styling**: Netflix-inspired dark theme

### Planned Migration
- **Backend**: AWS Amplify + Lambda functions
- **Database**: DynamoDB for user data
- **API Layer**: GraphQL with AppSync
- **State Management**: Redux Toolkit + RTK Query
- **Caching**: Multi-level caching strategy

## 📱 App Structure

```
app/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── AuthProvider.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── AuthNavigator.tsx
│   └── movie/          # Movie-related components
├── config/
│   └── amplify.ts      # AWS Amplify configuration
├── services/
│   └── authService.ts  # Authentication service
├── (tabs)/             # Main app screens
│   ├── index.tsx       # Home/Browse
│   ├── search.tsx      # Search movies
│   ├── watchlist.tsx   # User's watchlist
│   └── map.tsx         # Movie theaters
└── _layout.tsx         # Root layout with auth
```

## 🔐 Authentication Flow

1. **Sign Up**: Email + password with email verification
2. **Sign In**: Email + password authentication
3. **Verification**: Email confirmation code required
4. **Persistence**: Session maintained across app restarts
5. **Sign Out**: Clear session and return to auth screens

## 🛠️ Development

### Adding New Features

1. **Check the Memory Bank**: Review `memory-bank/` for architectural decisions
2. **Follow Patterns**: Use established components and services
3. **Update Documentation**: Keep memory bank updated

### Environment Variables

The app uses environment variables for configuration:
- `EXPO_PUBLIC_AWS_CLIENT_ID`: Cognito app client ID
- `EXPO_PUBLIC_AWS_USER_POOL_ID`: Cognito user pool ID  
- `EXPO_PUBLIC_AWS_REGION`: AWS region
- `EXPO_PUBLIC_TMDB_API_KEY`: The Movie Database API key

### Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🔧 Configuration

### AWS Cognito Setup

1. Create a User Pool in AWS Cognito
2. Configure sign-in options (email)
3. Create an app client (public client, no secret)
4. Note the User Pool ID and Client ID
5. Add these to your `.env` file

### TMDB API Setup

1. Create account at [The Movie Database](https://www.themoviedb.org/)
2. Get API key from account settings
3. Add to `.env` file (or use the provided demo key)

## 📋 Project Status

- ✅ Core movie discovery functionality
- ✅ AWS Cognito authentication
- ✅ Basic user registration/login
- ✅ Email verification flow
- 🚧 Redux state management migration
- 🚧 AWS Amplify backend integration
- 📅 Planned: DynamoDB user data storage
- 📅 Planned: Offline sync capabilities

## 🚨 Security Notes

- API keys are properly secured using environment variables
- User authentication handled by AWS Cognito
- No sensitive data stored locally
- Session management with secure token storage

## 🤝 Contributing

1. Review the memory bank documentation
2. Follow existing code patterns
3. Add tests for new features
4. Update documentation as needed

## 📄 License

This project is for educational/demo purposes.

---

**Tetflix** - Bringing the Netflix experience to movie discovery with modern React Native architecture.
