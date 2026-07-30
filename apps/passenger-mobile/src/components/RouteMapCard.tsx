import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { passengerApi } from '../lib/passenger-api';
import { colors, radius, spacing } from '../theme/tokens';

export function RouteMapCard({ routeId }: { routeId: string }) {
  const mapRef = useRef<MapView>(null);
  const routeQuery = useQuery({
    queryKey: ['passenger-route', routeId],
    queryFn: () => passengerApi.getRoute(routeId),
  });
  const path = routeQuery.data?.pathCoordinates ?? [];
  const mapCoordinates = path.map(({ lat, lng }) => ({
    latitude: lat,
    longitude: lng,
  }));

  useEffect(() => {
    if (mapCoordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(mapCoordinates, {
      animated: false,
      edgePadding: { top: 42, right: 42, bottom: 42, left: 42 },
    });
  }, [routeQuery.data]);

  if (!routeQuery.data || mapCoordinates.length < 2) return null;
  const route = routeQuery.data;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ROUTE {route.routeNumber ?? ''}</Text>
          <Text style={styles.title}>{route.name}</Text>
        </View>
        <Text style={styles.meta}>
          {route.distanceKm != null ? `${route.distanceKm} km` : ''}
          {route.estimatedDurationMin != null
            ? ` · ~${route.estimatedDurationMin} min`
            : ''}
        </Text>
      </View>
      <MapView
        ref={mapRef}
        initialRegion={{
          latitude: 7.8731,
          longitude: 80.7718,
          latitudeDelta: 3.5,
          longitudeDelta: 3.5,
        }}
        rotateEnabled={false}
        style={styles.map}
      >
        <Polyline
          coordinates={mapCoordinates}
          strokeColor={colors.brand700}
          strokeWidth={5}
        />
        <Marker
          coordinate={mapCoordinates[0]}
          pinColor={colors.emerald700}
          title="Origin"
        />
        <Marker
          coordinate={mapCoordinates[mapCoordinates.length - 1]}
          pinColor={colors.rose600}
          title="Destination"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.brand700,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.slate900,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  meta: {
    color: colors.slate500,
    fontSize: 12,
    fontWeight: '600',
  },
  map: { height: 260, width: '100%' },
});
