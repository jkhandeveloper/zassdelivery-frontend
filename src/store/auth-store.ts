"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
 * localStorage, hardened against the two ways it can take the app down.
 *
 * A corrupt entry — a partial write, a stale schema, anything hand-edited —
 * makes the default storage throw inside rehydration. That leaves `hydrated`
 * false, so `isReady` never flips and every guarded route sits on its skeleton
 * forever with no way out but clearing storage by hand. Treating unparseable
 * data as "no session" turns a bricked app into a trip to the login screen.
 *
 * Access itself can also throw — Safari private mode, storage disabled by
 * policy — which would otherwise break the store on construction.
 */
const authStorage = createJSONStorage<Pick<AuthState, "user" | "tokens">>(() => ({
  getItem: (name) => {
    let raw: string | null = null;

    try {
      raw = globalThis.localStorage.getItem(name);
    } catch {
      return null;
    }

    if (raw === null) {
      return null;
    }

    try {
      JSON.parse(raw);
      return raw;
    } catch {
      try {
        globalThis.localStorage.removeItem(name);
      } catch {
        // Nothing more to do; returning null already recovers the session.
      }

      return null;
    }
  },
  setItem: (name, value) => {
    try {
      globalThis.localStorage.setItem(name, value);
    } catch {
      // Over quota or storage disabled: the session stays in memory for this
      // tab rather than failing the write path that set it.
    }
  },
  removeItem: (name) => {
    try {
      globalThis.localStorage.removeItem(name);
    } catch {
      // Same reasoning as setItem.
    }
  },
}));

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
      storage: authStorage,
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        if (state !== undefined) {
          state.setHydrated(true);
          return;
        }

        // Rehydration still threw despite the guarded storage above. `hydrated`
        // has to flip regardless — it is what every route guard waits on — so
        // fall back to the store itself. Deferred because sync storage can run
        // this during create(), before the binding below exists.
        queueMicrotask(() => {
          useAuthStore.getState().setHydrated(true);
        });
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
