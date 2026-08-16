"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthTokens, AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  /** False until the persisted session has been read back from storage. */
  hydrated: boolean;

  setSession: (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
}

export const AUTH_STORAGE_KEY = "zass.auth";

/**
 * The session, held outside React so the axios interceptor and the socket
 * singleton can read it without a hook.
 *
 * Tokens live in localStorage rather than a cookie because the API is on
 * another origin and issues bearer tokens — there is no cookie to share. That
 * makes XSS the threat model to design against, which is why nothing here ever
 * interpolates untrusted HTML.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hydrated: false,

      setSession: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, tokens: null }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Non-reactive reads, for use outside React (api-client, socket). */
export const authSnapshot = {
  accessToken: (): string | null => useAuthStore.getState().tokens?.accessToken ?? null,
  refreshToken: (): string | null => useAuthStore.getState().tokens?.refreshToken ?? null,
  user: (): AuthUser | null => useAuthStore.getState().user,
};
