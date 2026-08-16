"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { authApi, type LoginPayload, type RegisterPayload } from "@/lib/api/auth";
import { setSessionLostHandler } from "@/lib/api-client";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";
import { homeRouteForRole, type AuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** False until the persisted session has been read back and revalidated. */
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: (options?: { allDevices?: boolean }) => Promise<void>;
  /** Re-reads GET /auth/me — call after anything that can change permissions. */
  refreshUser: () => Promise<AuthUser | null>;
  hasPermission: (code: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [revalidated, setRevalidated] = React.useState(false);

  // Kept in a ref so the session-lost effect below does not re-register on
  // every navigation. Written in an effect rather than during render.
  const pathnameRef = React.useRef(pathname);

  React.useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const clearLocalSession = React.useCallback(() => {
    useAuthStore.getState().clearSession();
    disconnectSocket();
    queryClient.clear();
  }, [queryClient]);

  /**
   * §0: a refresh failure is a full logout. The API client calls this when the
   * refresh token is rejected — reused, expired, or the family was revoked.
   */
  React.useEffect(() => {
    setSessionLostHandler(() => {
      disconnectSocket();
      queryClient.clear();

      const current = pathnameRef.current;
      const isAuthScreen = current.startsWith("/login") || current.startsWith("/register");

      if (!isAuthScreen) {
        // Bring them back where they were once they sign in again.
        router.replace(`/login?next=${encodeURIComponent(current)}&reason=expired`);
      }
    });

    return () => setSessionLostHandler(null);
  }, [queryClient, router]);

  /**
   * A persisted session is a claim, not proof. Revalidate it against
   * GET /auth/me on boot: the account may have been suspended, its role
   * changed, or its permissions revoked since the token was minted.
   */
  React.useEffect(() => {
    // No session to revalidate — `isReady` accounts for that case directly
    // rather than round-tripping through state.
    if (!hydrated || useAuthStore.getState().tokens === null) {
      return;
    }

    let cancelled = false;

    authApi
      .me()
      .then((fresh) => {
        if (!cancelled) {
          useAuthStore.getState().setUser(fresh);
        }
      })
      .catch(() => {
        // A 401 has already been handled by the interceptor (refresh, then
        // session-lost). Anything else — offline, 500 — leaves the cached user
        // in place rather than signing someone out because the server hiccuped.
      })
      .finally(() => {
        if (!cancelled) {
          setRevalidated(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // Deliberately keyed on `hydrated` alone: the token is read imperatively
    // above so that a silent refresh, which rotates it, does not fire another
    // /auth/me on every rotation.
  }, [hydrated]);

  // The socket's handshake token is kept current by RealtimeProvider, which
  // reacts to the same access token in the store.

  const login = React.useCallback(
    async (payload: LoginPayload) => {
      const result = await authApi.login(payload);
      useAuthStore.getState().setSession(result.user, result.tokens);
      queryClient.clear();

      return result.user;
    },
    [queryClient],
  );

  const register = React.useCallback(
    async (payload: RegisterPayload) => {
      const result = await authApi.register(payload);
      useAuthStore.getState().setSession(result.user, result.tokens);
      queryClient.clear();

      return result.user;
    },
    [queryClient],
  );

  const logout = React.useCallback(
    async (options?: { allDevices?: boolean }) => {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;

      try {
        await authApi.logout({
          ...(refreshToken !== undefined && { refreshToken }),
          ...(options?.allDevices === true && { allDevices: true }),
        });
      } catch {
        // Signing out locally must succeed even if the call does not —
        // otherwise a user on a flaky connection cannot leave a shared device.
      }

      clearLocalSession();
      router.replace("/login");
    },
    [clearLocalSession, router],
  );

  const refreshUser = React.useCallback(async () => {
    if (useAuthStore.getState().tokens === null) {
      return null;
    }

    const fresh = await authApi.me();
    useAuthStore.getState().setUser(fresh);

    return fresh;
  }, []);

  const hasPermission = React.useCallback(
    (code: string) => user?.permissions.includes(code) ?? false,
    [user],
  );

  // Ready once storage has been read and — if there was a session in it — the
  // server has been asked whether it is still good.
  const isReady = hydrated && (tokens === null || revalidated);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null && tokens !== null,
      isReady,
      login,
      register,
      logout,
      refreshUser,
      hasPermission,
    }),
    [user, tokens, isReady, login, register, logout, refreshUser, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}

export { homeRouteForRole };
