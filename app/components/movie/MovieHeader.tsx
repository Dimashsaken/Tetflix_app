import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Heart, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface MovieHeaderProps {
  title: string;
  tagline?: string;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

const MovieHeader = ({ title, tagline, isInWatchlist, onToggleWatchlist }: MovieHeaderProps) => {
  const router = useRouter();

  return (
    <>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {tagline && (
            <Text style={styles.tagline}>"{tagline}"</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.watchlistButton,
            isInWatchlist && styles.watchlistButtonActive,
          ]}
          onPress={onToggleWatchlist}>
          <Heart
            size={24}
            color="#FFFFFF"
            fill={isInWatchlist ? '#E50914' : 'none'}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 130,
    marginBottom: 10,
    paddingTop: 5,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  watchlistButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 29, 43, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    borderColor: '#E50914',
  },
});

export default MovieHeader; 