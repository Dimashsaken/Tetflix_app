import { Tabs } from 'expo-router';
import { Chrome as Home, Heart, Search, Map } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1F1D2B',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#E21221',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: {
          backgroundColor: '#1F1D2B',
        },
        headerTintColor: '#FFFFFF',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Movies',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ size, color }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Theatres',
          tabBarIcon: ({ size, color }) => <Map size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}