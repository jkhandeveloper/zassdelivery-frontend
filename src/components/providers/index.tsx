"use client";

import * as React from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { RealtimeProvider } from "./realtime-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Provider order matters: auth needs the query client to clear caches on
 * sign-out, and realtime needs a token from auth before it will connect.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <Toaster
              position="top-right"
              closeButton
              richColors={false}
              toastOptions={{
                className:
                  "!rounded-[var(--radius-input)] !border !border-border-default !bg-surface !text-primary !shadow-panel",
              }}
            />
          </RealtimeProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
