import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Theatre } from '../utils/mapService';

interface MarkerClusterProps {
  markers: Theatre[];
  onMarkerPress: (theatre: Theatre) => void;
  selectedTheatre: Theatre | null;
  clusteringEnabled: boolean;
  clusteringRadius: number; // in pixels
}

const MarkerCluster: React.FC<MarkerClusterProps> = ({
  markers,
  onMarkerPress,
  selectedTheatre,
  clusteringEnabled = true,
  clusteringRadius = 50, // default clustering radius
}) => {
  // If clustering is disabled, just render regular markers
  if (!clusteringEnabled) {
    return (
      <>
        {markers.map((theatre) => (
          <Marker
            key={theatre.id}
            coordinate={theatre.location}
            title={theatre.name}
            description={theatre.address}
            pinColor={selectedTheatre?.id === theatre.id ? 'blue' : 'red'}
            onPress={() => onMarkerPress(theatre)}
          />
        ))}
      </>
    );
  }

  // For clustering, we'll group markers based on their proximity
  const clusters = useMemo(() => {
    // In a real app, use a spatial algorithm like quadtree, k-means, etc.
    // This is a simple distance-based clustering for demonstration
    const result: {
      latitude: number;
      longitude: number;
      theatres: Theatre[];
    }[] = [];

    markers.forEach((theatre) => {
      // Find an existing cluster that this marker can join
      const existingCluster = result.find((cluster) => {
        const latDiff = theatre.location.latitude - cluster.latitude;
        const lngDiff = theatre.location.longitude - cluster.longitude;
        // Simple Euclidean distance (not accurate for geographic coordinates but fine for clustering visualization)
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        // Convert clusteringRadius from pixels to rough lat/lng equivalent (very approximate)
        // A more accurate approach would use a proper projection
        const approximateClusteringRadiusInCoords = clusteringRadius * 0.0001; // Very rough approximation
        return distance < approximateClusteringRadiusInCoords;
      });

      if (existingCluster) {
        // Add to existing cluster
        existingCluster.theatres.push(theatre);
        // Update cluster center (average of all points)
        existingCluster.latitude =
          existingCluster.theatres.reduce((sum, t) => sum + t.location.latitude, 0) /
          existingCluster.theatres.length;
        existingCluster.longitude =
          existingCluster.theatres.reduce((sum, t) => sum + t.location.longitude, 0) /
          existingCluster.theatres.length;
      } else {
        // Create new cluster
        result.push({
          latitude: theatre.location.latitude,
          longitude: theatre.location.longitude,
          theatres: [theatre],
        });
      }
    });

    return result;
  }, [markers, clusteringRadius]);

  return (
    <>
      {clusters.map((cluster, index) => {
        const isCluster = cluster.theatres.length > 1;
        
        // If this is a single marker
        if (cluster.theatres.length === 1) {
          const theatre = cluster.theatres[0];
          return (
            <Marker
              key={theatre.id}
              coordinate={theatre.location}
              title={theatre.name}
              description={theatre.address}
              pinColor={selectedTheatre?.id === theatre.id ? 'blue' : 'red'}
              onPress={() => onMarkerPress(theatre)}
            />
          );
        }
        
        // If this is a cluster with multiple markers
        return (
          <Marker
            key={`cluster-${index}`}
            coordinate={{
              latitude: cluster.latitude,
              longitude: cluster.longitude,
            }}
            onPress={() => {
              // If the cluster has just a few theaters, show the first one
              // In a real app, you'd want to zoom in to show all markers in cluster
              if (cluster.theatres.length > 0) {
                onMarkerPress(cluster.theatres[0]);
              }
            }}
          >
            <View style={styles.clusterMarker}>
              <Text style={styles.clusterText}>{cluster.theatres.length}</Text>
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF5252',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterMarker: {
    backgroundColor: '#FF5252',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MarkerCluster; 