import type { User } from '@bus-booking/shared-types';
import { useQuery } from '@tanstack/react-query';
import { gatewayRequest } from './gateway';

export function usePassengerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () =>
      gatewayRequest<User>('/users/profile/get', { body: { userId } }),
    enabled: Boolean(userId),
    // A missing profile row is a normal state for a freshly registered account.
    retry: false,
  });
}
