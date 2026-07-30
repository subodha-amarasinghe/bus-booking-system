import { useRouter } from 'expo-router';
import { Button } from './ui/Button';
import { EmptyState, LoadingBlock } from './ui/Feedback';
import { Screen } from './ui/Screen';
import { useAuth, type PassengerSession } from '../lib/auth-context';

/**
 * Screen-level equivalent of the web app's `(authenticated)` layout: renders the
 * children only once a validated session exists.
 */
export function AuthGate({
  children,
  message = 'Sign in to continue with your booking.',
}: {
  children: (session: PassengerSession) => React.ReactNode;
  message?: string;
}) {
  const router = useRouter();
  const { session, restoring } = useAuth();

  if (restoring) {
    return (
      <Screen>
        <LoadingBlock label="Checking your session…" />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState
          body={message}
          icon="lock-closed-outline"
          title="Sign in required"
        />
        <Button
          fullWidth
          label="Sign in"
          onPress={() => router.push('/login')}
        />
        <Button
          fullWidth
          label="Create an account"
          onPress={() => router.push('/register')}
          variant="secondary"
        />
      </Screen>
    );
  }

  return <>{children(session)}</>;
}
