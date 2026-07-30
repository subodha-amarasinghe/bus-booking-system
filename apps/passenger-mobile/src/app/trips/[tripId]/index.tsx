import { useLocalSearchParams } from 'expo-router';
import { AuthGate } from '../../../components/AuthGate';
import { EmptyState } from '../../../components/ui/Feedback';
import { Screen } from '../../../components/ui/Screen';
import { SeatSelection } from '../../../features/seat-selection/SeatSelection';

export default function TripSeatMapScreen() {
  const params = useLocalSearchParams<{
    tripId?: string;
    fare?: string;
    currency?: string;
    departureAt?: string;
  }>();

  if (!params.tripId) {
    return (
      <Screen>
        <EmptyState
          body="Search for a trip and pick it again."
          icon="alert-circle-outline"
          title="Trip not found"
        />
      </Screen>
    );
  }

  const fare = Number(params.fare);

  return (
    <AuthGate message="Sign in to hold seats for this trip.">
      {(session) => (
        <SeatSelection
          currency={params.currency ?? 'LKR'}
          departureAt={params.departureAt}
          fare={Number.isFinite(fare) ? fare : 0}
          session={session}
          tripId={params.tripId as string}
        />
      )}
    </AuthGate>
  );
}
