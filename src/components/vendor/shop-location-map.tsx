"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl from "maplibre-gl";
import { useTheme } from "next-themes";
import * as React from "react";

import { cn } from "@/lib/utils";
import type { Coordinates } from "@/types/geo";

const STYLE_URL = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

/** Close enough to see the street the shop is on. */
const PIN_ZOOM = 16;

/**
 * The map half of the shop location picker: one draggable pin.
 *
 * Tapping the map moves the pin there, dragging it fine-tunes it. Loaded
 * client-side only — MapLibre needs the DOM.
 */
export function ShopLocationMap({
  value,
  fallbackCenter,
  onChange,
  className,
}: {
  value: Coordinates | null;
  /** Where to start when no pin has been placed yet. */
  fallbackCenter: Coordinates;
  onChange: (point: Coordinates) => void;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const { resolvedTheme } = useTheme();
  const styleUrl = resolvedTheme === "dark" ? STYLE_URL.dark : STYLE_URL.light;

  React.useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) return;

    const start = value ?? fallbackCenter;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [start.longitude, start.latitude],
      zoom: value === null ? 13 : PIN_ZOOM,
      scrollZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });

    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    map.on("click", (event) => {
      onChangeRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Built once; the pin and theme are kept in step by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    mapRef.current?.setStyle(styleUrl);
  }, [styleUrl]);

  // The pin follows the value, wherever it came from: a tap, a drag, or the
  // device's own position.
  React.useEffect(() => {
    const map = mapRef.current;
    if (map === null) return;

    if (value === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [value.longitude, value.latitude];

    if (markerRef.current === null) {
      const marker = new maplibregl.Marker({ color: "#0E7490", draggable: true })
        .setLngLat(lngLat)
        .addTo(map);

      marker.on("dragend", () => {
        const at = marker.getLngLat();
        onChangeRef.current({ latitude: at.lat, longitude: at.lng });
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    // Only move the camera when the pin has left the view — a drag inside it
    // should not make the map jump.
    if (!map.getBounds().contains(lngLat)) {
      map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), PIN_ZOOM) });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map: tap to place your shop, or drag the pin"
      className={cn(
        "h-72 w-full overflow-hidden rounded-[var(--radius-input)] border border-border-subtle",
        className,
      )}
    />
  );
}
