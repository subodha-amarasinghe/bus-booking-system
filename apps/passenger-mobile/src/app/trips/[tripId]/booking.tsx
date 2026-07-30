import { useLocalSearchParams } from 'expo-router';
import { AuthGate } from '../../../components/AuthGate';
import { EmptyState } from '../../../components/ui/Feedback';
import { Screen } from '../../../components/ui/Screen';
import { BookingForm } from '../../../features/booking/BookingForm';

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams<{
    tripId?: string;
    fare?: string;
    currency?: string;
  }>();

  if (!params.tripId) {
    return (
      <Screen>
        <EmptyState
          body="Start again from search."
          icon="alert-circle-outline"
          title="Trip not found"
        />
      </Screen>
    );
  }

  const fare = Number(params.fare);

  return (
    <AuthGate>
      {(session) => (
        <BookingForm
          currency={params.currency ?? 'LKR'}
          fare={Number.isFinite(fare) ? fare : 0}
          session={session}
          tripId={params.tripId as string}
        />
      )}
    </AuthGate>
  );
}
