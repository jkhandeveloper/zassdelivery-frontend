"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { geoApi } from "@/lib/api/geo";
import type { Coordinates } from "@/types/geo";

export const geoKeys = {
  all: ["geo"] as const,
  zones: () => [...geoKeys.all, "zones"] as const,
};

/**
 * The service area.
 *
 * Geography changes when the company opens a town, so this is cached for the
 * session rather than refetched per screen.
 */
export function useZones() {
  return useQuery({
    queryKey: geoKeys.zones(),
    queryFn: () => geoApi.listZones(),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export type GeolocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; coordinates: Coordinates; accuracyMetres: number | null }
  | { status: "error"; message: string };

/** Copy per PositionError code — the browser's own text is not user-facing. */
function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was blocked. Allow it in your browser, or pick your area below.";
    case error.POSITION_UNAVAILABLE:
      return "Your device couldn't work out where it is. Pick your area below instead.";
    case error.TIMEOUT:
      return "Finding your location took too long. Try again, or pick your area below.";
    default:
      return "We couldn't get your location. Pick your area below instead.";
  }
}

/**
 * The device's position, on request.
 *
 * Deliberately never asked for on mount: a permission prompt that appears
 * before the customer has asked for anything is the one they reflexively
 * dismiss, and a denied prompt cannot be re-asked.
 */
export function useGeolocation(): GeolocationState & { locate: () => void; reset: () => void } {
  const [state, setState] = React.useState<GeolocationState>({ status: "idle" });

  const locate = React.useCallback(() => {
    if (typeof navigator === "undefined" || navigator.geolocation === undefined) {
      setState({
        status: "error",
        message: "This browser can't share your location. Pick your area below instead.",
      });
      return;
    }

    setState({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          status: "ready",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracyMetres:
            Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
        }),
      (error) => setState({ status: "error", message: describeGeolocationError(error) }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }, []);

  const reset = React.useCallback(() => setState({ status: "idle" }), []);

  return { ...state, locate, reset };
}
