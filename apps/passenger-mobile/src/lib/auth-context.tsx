import type {
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
} from '@bus-booking/shared-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { gatewayRequest } from './gateway';
import { clearTokens, getAccessToken, saveTokens } from './secure-token';

export interface PassengerSession {
  userId: string;
  phone?: string;
  role?: string;
}

interface AuthContextValue {
  session: PassengerSession | null;
  /** True until the stored token has been checked on cold start. */
  restoring: boolean;
  signIn(input: LoginRequest): Promise<void>;
  signUp(input: RegisterRequest): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ValidateResponse {
  valid?: boolean;
  userId?: string;
  sub?: string;
  phone?: string;
  role?: string;
}

async function validateStoredToken(): Promise<PassengerSession | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const data = await gatewayRequest<ValidateResponse>('/auth/validate', {
      body: { token },
      auth: false,
    });
    const userId = data.userId ?? data.sub;
    if (data.valid === false || !userId) return null;
    return { userId, phone: data.phone, role: data.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PassengerSession | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    void validateStoredToken().then((restored) => {
      if (!active) return;
      setSession(restored);
      setRestoring(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(
    async (path: '/auth/login' | '/auth/register', body: unknown) => {
      const tokens = await gatewayRequest<AuthTokenResponse>(path, {
        body,
        auth: false,
      });
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      // The gateway returns the id directly, so no extra validate round trip.
      setSession({ userId: tokens.userId });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      restoring,
      signIn: (input) => authenticate('/auth/login', input),
      signUp: (input) => authenticate('/auth/register', input),
      signOut: async () => {
        await clearTokens();
        setSession(null);
      },
    }),
    [authenticate, restoring, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
