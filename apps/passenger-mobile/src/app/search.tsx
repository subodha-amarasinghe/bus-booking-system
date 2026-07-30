import type { SearchTripsRequest } from '@bus-booking/shared-types';
import { useTripSearch } from '@bus-booking/passenger-core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TripCard } from '../components/TripCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '../components/ui/Feedback';
import { Screen, SectionTitle } from '../components/ui/Screen';
import { TripSearchForm } from '../features/search/TripSearchForm';
import { locationName, routeLabel, useLocations, useRoutes } from '../lib/catalog';
import { formatDate, shiftDateKey, toDateKey } from '../lib/format';
import { passengerApi } from '../lib/passenger-api';
import { colors, fontSize, spacing } from '../theme/tokens';

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    originLocationId?: string;
    destinationLocationId?: string;
    departureDate?: string;
  }>();

  const [query, setQuery] = useState({
    originLocationId: params.originLocationId,
    destinationLocationId: params.destinationLocationId,
    departureDate: params.departureDate ?? toDateKey(),
  });
  const [refining, setRefining] = useState(false);

  const locations = useLocations();
  const routes = useRoutes();

  const request = useMemo<SearchTripsRequest>(
    () => ({
      ...(query.originLocationId
        ? { originLocationId: query.originLocationId }
        : {}),
      ...(query.destinationLocationId
        ? { destinationLocationId: query.destinationLocationId }
        : {}),
      // The schema expects a Date; the strip gives us a local `yyyy-mm-dd` key.
      ...(query.departureDate
        ? { departureDate: new Date(`${query.departureDate}T00:00:00`) }
        : {}),
      page: 1,
      limit: 30,
    }),
    [query],
  );

  const trips = useTripSearch(passengerApi, request);

  const heading = `${locationName(
    locations.data,
    query.originLocationId,
  )} → ${locationName(locations.data, query.destinationLocationId)}`;

  return (
    <Screen onRefresh={() => void trips.refetch()} refreshing={trips.isFetching}>
      <SectionTitle
        subtitle={
          query.departureDate ? formatDate(query.departureDate) : undefined
        }
        title={heading}
      />

      {refining ? (
        <Card>
          <TripSearchForm
            initial={{
              originLocationId: query.originLocationId,
              destinationLocationId: query.destinationLocationId,
              departureDate: query.departureDate,
            }}
            locations={locations.data ?? []}
            onSubmit={(values) => {
              setQuery(values);
              setRefining(false);
            }}
            submitLabel="Update search"
          />
        </Card>
      ) : (
        <Button
          icon="options-outline"
          label="Change search"
          onPress={() => setRefining(true)}
          variant="secondary"
        />
      )}

      {trips.isPending ? (
        <LoadingBlock label="Finding buses…" />
      ) : trips.isError ? (
        <ErrorState
          message={
            trips.error instanceof Error
              ? trips.error.message
              : 'Could not load trips.'
          }
          onRetry={() => void trips.refetch()}
        />
      ) : (trips.data ?? []).length === 0 ? (
        <View style={styles.stack}>
          <EmptyState
            body="Nothing is scheduled for this route and date."
            icon="bus-outline"
            title="No buses found"
          />
          <Text style={styles.nearbyLabel}>Try a nearby date</Text>
          <View style={styles.nearbyRow}>
            {[-1, 1].map((offset) => {
              const nextDate = shiftDateKey(
                query.departureDate ?? toDateKey(),
                offset,
              );
              return (
                <Button
                  key={offset}
                  label={formatDate(nextDate)}
                  onPress={() =>
                    setQuery((current) => ({
                      ...current,
                      departureDate: nextDate,
                    }))
                  }
                  style={styles.nearbyButton}
                  variant="secondary"
                />
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.stack}>
          <Text style={styles.count}>
            {trips.data.length} departure{trips.data.length === 1 ? '' : 's'}
          </Text>
          {trips.data.map((trip) => (
            <TripCard
              key={trip.id}
              onPress={() =>
                router.push({
                  pathname: '/trips/[tripId]',
                  params: {
                    tripId: trip.id,
                    routeId: trip.routeId,
                    fare: String(trip.fareAmount),
                    currency: trip.currency,
                    departureAt: String(trip.departureAt),
                  },
                })
              }
              routeLabel={routeLabel(routes.data, locations.data, trip.routeId)}
              trip={trip}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  count: { fontSize: fontSize.xs, color: colors.slate500, fontWeight: '600' },
  nearbyLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.slate600,
    textAlign: 'center',
  },
  nearbyRow: { flexDirection: 'row', gap: spacing.sm },
  nearbyButton: { flex: 1 },
});
