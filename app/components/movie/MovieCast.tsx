import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { getImageUrl } from '../../config/api';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

interface MovieCastProps {
  cast: CastMember[];
}

const MovieCast = ({ cast }: MovieCastProps) => {
  if (!cast.length) return null;

  const renderCastItem = ({ item }: { item: CastMember }) => (
    <View style={styles.castCard}>
      <Image
        source={{ uri: getImageUrl(item.profile_path, 'w185') }}
        style={styles.castImage}
      />
      <Text style={styles.castName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.characterName} numberOfLines={1}>
        {item.character}
      </Text>
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Cast</Text>
      <FlatList
        data={cast}
        renderItem={renderCastItem}
        keyExtractor={(item) => `cast-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.castList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  castList: {
    paddingVertical: 8,
  },
  castCard: {
    width: 100,
    marginRight: 12,
  },
  castImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2D2B43',
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  characterName: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default MovieCast; 