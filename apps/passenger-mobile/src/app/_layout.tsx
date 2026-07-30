import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth-context';
import { colors } from '../theme/tokens';

const HEADER = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.slate900,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={HEADER}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{ title: 'Sign in', presentation: 'modal' }}
            />
            <Stack.Screen
              name="register"
              options={{ title: 'Create account', presentation: 'modal' }}
            />
            <Stack.Screen name="search" options={{ title: 'Trips' }} />
            <Stack.Screen
              name="trips/[tripId]/index"
              options={{ title: 'Choose seats' }}
            />
            <Stack.Screen
              name="trips/[tripId]/booking"
              options={{ title: 'Passenger details' }}
            />
            <Stack.Screen
              name="payment/[bookingId]"
              options={{ title: 'Payment' }}
            />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
