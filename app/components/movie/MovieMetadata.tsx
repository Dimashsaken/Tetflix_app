import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star, Calendar, Clock } from 'lucide-react-native';

interface MovieMetadataProps {
  voteAverage: number;
  releaseDate: string;
  runtime: number;
}

const MovieMetadata = ({ voteAverage, releaseDate, runtime }: MovieMetadataProps) => {
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={styles.metadataContainer}>
      <View style={styles.metadataItem}>
        <Star size={18} color="#FFC107" fill="#FFC107" />
        <Text style={styles.metadataText}>
          {voteAverage.toFixed(1)} / 10
        </Text>
      </View>
      {releaseDate && (
        <View style={styles.metadataItem}>
          <Calendar size={18} color="#FFFFFF" />
          <Text style={styles.metadataText}>
            {new Date(releaseDate).getFullYear()}
          </Text>
        </View>
      )}
      {runtime > 0 && (
        <View style={styles.metadataItem}>
          <Clock size={18} color="#FFFFFF" />
          <Text style={styles.metadataText}>
            {formatRuntime(runtime)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metadataContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    marginLeft: 130,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metadataText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default MovieMetadata; 