"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import * as React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // The warm cream canvas is not a colour the browser would pick for the
      // transition, so let next-themes suppress it rather than flash white.
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
