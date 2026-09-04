"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useTheme } from "next-themes";
import * as React from "react";

import type { Coordinates } from "@/lib/socket-events";
import { cn } from "@/lib/utils";

/** OpenStreetMap's own tiles: no key, no account, attribution required. */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export interface DeliveryMapProps {
  /** The restaurant the order is collected from. */
  pickup: Coordinates | null;
  /** Where it is going. Null when the address never resolved to a point. */
  destination: Coordinates | null;
  /** The rider's last known position, or null before their first report. */
  rider: Coordinates | null;
  riderName: string | null;
  className?: string;
}

/**
 * Where the rider is, on a real map.
 *
 * Leaflet is driven imperatively rather than wrapped in a React component tree:
 * the map is a long-lived object that owns its own DOM, and re-creating it on
 * every position report — one every few seconds for the length of a delivery —
 * would tear down and rebuild the tile layer each time. So the map is built
 * once and the markers are *moved*, which is also what makes the rider dot
 * glide instead of jumping.
 *
 * Marker icons are `divIcon`s rather than Leaflet's default images on purpose.
 * The stock icons are referenced by a URL Leaflet assembles at runtime, which a
 * bundler cannot see and therefore does not emit — the classic "markers are
 * invisible in production" bug. HTML markers also theme themselves from the
 * same CSS variables as the rest of the app.
 */
export function DeliveryMap({
  pickup,
  destination,
  rider,
  riderName,
  className,
}: DeliveryMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<Record<"pickup" | "destination" | "rider", L.Marker | null>>({
    pickup: null,
    destination: null,
    rider: null,
  });
  const routeRef = React.useRef<L.Polyline | null>(null);
  /** Bounds are fitted once; after that the map follows the rider. */
  const fittedRef = React.useRef(false);

  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      // A map inside a scrolling page that grabs the wheel is a map the reader
      // gets stuck in. Dragging and the +/− control still zoom.
      scrollWheelZoom: false,
      // Pabbi, as a sane starting frame before any real point arrives.
      center: [34.0151, 71.7938],
      zoom: 13,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = { pickup: null, destination: null, rider: null };
      routeRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // ── Markers and the line between them ──────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (map === null) return;

    const place = (
      key: "pickup" | "destination" | "rider",
      point: Coordinates | null,
      icon: L.DivIcon,
      tooltip: string,
    ) => {
      const existing = markersRef.current[key];

      if (point === null) {
        existing?.remove();
        markersRef.current[key] = null;
        return;
      }

      const position = L.latLng(point.latitude, point.longitude);

      if (existing === null) {
        markersRef.current[key] = L.marker(position, { icon, zIndexOffset: key === "rider" ? 1000 : 0 })
          .addTo(map)
          .bindTooltip(tooltip, { direction: "top", offset: [0, -14] });
        return;
      }

      existing.setLatLng(position);
      existing.setTooltipContent(tooltip);
    };

    place("pickup", pickup, pinIcon("pickup"), "Restaurant");
    place("destination", destination, pinIcon("destination"), "Your address");
    place("rider", rider, riderIcon(), riderName ?? "Your rider");

    // The straight line is honestly a straight line — it is the distance left,
    // not a route. Drawing a fake road here would be a promise the app cannot
    // keep, so it is dashed rather than solid.
    const legEnd = destination;

    if (rider !== null && legEnd !== null) {
      const path: L.LatLngExpression[] = [
        [rider.latitude, rider.longitude],
        [legEnd.latitude, legEnd.longitude],
      ];

      if (routeRef.current === null) {
        routeRef.current = L.polyline(path, {
          color: "#22d3ee",
          weight: 3,
          opacity: 0.8,
          dashArray: "6 8",
        }).addTo(map);
      } else {
        routeRef.current.setLatLngs(path);
      }
    } else {
      routeRef.current?.remove();
      routeRef.current = null;
    }

    const known = [pickup, destination, rider].filter((point): point is Coordinates => point !== null);

    if (known.length === 0) return;

    if (!fittedRef.current) {
      // The first frame shows the whole job — where it came from, where it is
      // going, and where the rider is between them.
      map.fitBounds(
        L.latLngBounds(known.map((point) => L.latLng(point.latitude, point.longitude))),
        { padding: [48, 48], maxZoom: 16 },
      );
      fittedRef.current = true;
      return;
    }

    // After that the rider leads. Panning only when they leave the frame means
    // a reader who has dragged the map to look at something is not yanked back
    // every few seconds.
    if (rider !== null) {
      const position = L.latLng(rider.latitude, rider.longitude);

      if (!map.getBounds().pad(-0.2).contains(position)) {
        map.panTo(position, { animate: true });
      }
    }
  }, [pickup, destination, rider, riderName]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle",
        // Leaflet ships one light tile set. Rather than pull in a second tile
        // provider (and a second attribution) for dark mode, the tiles alone
        // are inverted and re-hued — the markers and controls sit above this
        // pane and keep their own colours.
        resolvedTheme === "dark" && "[&_.leaflet-tile-pane]:brightness-[0.7] [&_.leaflet-tile-pane]:invert [&_.leaflet-tile-pane]:hue-rotate-180",
        className,
      )}
    >
      <div ref={containerRef} className="h-full w-full" aria-label="Live delivery map" role="application" />
    </div>
  );
}

/** A teardrop pin, coloured by which end of the run it marks. */
function pinIcon(kind: "pickup" | "destination"): L.DivIcon {
  const colour = kind === "pickup" ? "#ff8a3d" : "#8b5cf6";

  return L.divIcon({
    className: "",
    html: `
      <span style="
        display:block;width:20px;height:20px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);background:${colour};
        border:2px solid #ffffff;box-shadow:0 2px 6px rgb(3 18 32 / 0.4);
      "></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

/** The rider: a pulsing dot, so a still map still reads as live. */
function riderIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <span style="position:relative;display:block;width:22px;height:22px;">
        <span style="
          position:absolute;inset:0;border-radius:9999px;background:#22d3ee;opacity:0.35;
          animation:zass-rider-pulse 1.8s ease-out infinite;
        "></span>
        <span style="
          position:absolute;inset:4px;border-radius:9999px;background:#22d3ee;
          border:2px solid #ffffff;box-shadow:0 2px 6px rgb(3 18 32 / 0.45);
        "></span>
      </span>
      <style>
        @keyframes zass-rider-pulse {
          0% { transform: scale(0.7); opacity: 0.45; }
          100% { transform: scale(2.1); opacity: 0; }
        }
      </style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
