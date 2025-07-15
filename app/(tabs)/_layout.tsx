import { Tabs } from 'expo-router';
import { Chrome as Home, Heart, Search, Map, LogOut, Settings } from 'lucide-react-native';
import { useAuth } from '../components/auth/AuthProvider';
import { TouchableOpacity } from 'react-native';

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
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Home size={size} color={color} />,
          headerRight: () => {
            const { signOut, isLoading } = useAuth();
            return (
              <TouchableOpacity
                onPress={signOut}
                style={{ marginRight: 16 }}
                disabled={isLoading}
                accessibilityLabel="Log out"
              >
                <LogOut size={22} color="#E50914" />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Theatres',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="redux"
        options={{
          title: 'Redux Demo',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}