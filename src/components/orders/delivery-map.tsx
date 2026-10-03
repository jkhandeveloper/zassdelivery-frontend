"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import { useTheme } from "next-themes";
import * as React from "react";

import type { Coordinates } from "@/lib/socket-events";
import { cn } from "@/lib/utils";

/**
 * OpenFreeMap: free hosted OpenStreetMap vector tiles with no key, no account
 * and no request cap — the same tiles the mobile app draws.
 */
const STYLE_URL = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

const ROUTE_SOURCE = "rider-leg";
const ROUTE_LAYER = "rider-leg-line";

/**
 * How long one slide between rider fixes takes — just under the reporting
 * interval, so each slide lands before the next fix arrives.
 */
const GLIDE_MS = 1_200;

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

type MarkerKey = "pickup" | "destination" | "rider";

/**
 * Where the rider is, on a real map.
 *
 * MapLibre is driven imperatively rather than wrapped in a React component
 * tree: the map is a long-lived object that owns its own canvas, and
 * re-creating it on every position report — one every few seconds for the
 * length of a delivery — would refetch the style and tiles each time. So the
 * map is built once and the markers are *moved*, the rider's with a short
 * eased slide so the dot glides instead of jumping.
 *
 * Markers are plain HTML elements, so they theme themselves from the same CSS
 * variables as the rest of the app and survive a style swap untouched. The
 * dashed line is a map layer, which a style swap wipes, so it is re-added on
 * every `style.load`.
 */
export function DeliveryMap({
  pickup,
  destination,
  rider,
  riderName,
  className,
}: DeliveryMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<Record<MarkerKey, maplibregl.Marker | null>>({
    pickup: null,
    destination: null,
    rider: null,
  });
  /** Where the rider dot is drawn right now, mid-slide or not. */
  const riderDrawnRef = React.useRef<Coordinates | null>(null);
  const glideFrameRef = React.useRef(0);
  /** The line's end points, kept so a style swap can redraw it. */
  const legRef = React.useRef<[Coordinates, Coordinates] | null>(null);
  /** Bounds are fitted once; after that the map follows the rider. */
  const fittedRef = React.useRef(false);
  const styleRef = React.useRef<string | null>(null);
  /**
   * Whether the current style has finished loading, so layers can be added.
   * Tracked from `style.load` rather than read from `isStyleLoaded()`, which
   * also stays false while tiles are still downloading — long enough to skip
   * every redraw of a rider's slide.
   */
  const styleReadyRef = React.useRef(false);

  const { resolvedTheme } = useTheme();
  const styleUrl = resolvedTheme === "dark" ? STYLE_URL.dark : STYLE_URL.light;

  React.useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      // Pabbi, as a sane starting frame before any real point arrives.
      center: [71.7938, 34.0151],
      zoom: 13,
      // A map inside a scrolling page that grabs the wheel is a map the reader
      // gets stuck in. Dragging and the +/− control still zoom.
      scrollZoom: false,
      // A delivery is read north-up; rotation and tilt only get people lost.
      dragRotate: false,
      pitchWithRotate: false,
      // The OpenStreetMap credit the licence requires comes from the tiles'
      // own metadata, so the stock attribution control shows it unaided.
      attributionControl: { compact: true },
    });

    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    // Fired for the first style and again after every theme swap, which
    // removes all sources and layers that are not part of the style.
    map.on("style.load", () => {
      styleReadyRef.current = true;
      drawLeg(map, legRef.current);
    });

    mapRef.current = map;
    styleRef.current = styleUrl;

    return () => {
      cancelAnimationFrame(glideFrameRef.current);
      map.remove();
      mapRef.current = null;
      markersRef.current = { pickup: null, destination: null, rider: null };
      riderDrawnRef.current = null;
      legRef.current = null;
      fittedRef.current = false;
      styleRef.current = null;
      styleReadyRef.current = false;
    };
    // The map is built once; theme changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Light and dark ─────────────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (map === null || styleRef.current === styleUrl) return;

    styleRef.current = styleUrl;
    styleReadyRef.current = false;
    map.setStyle(styleUrl);
  }, [styleUrl]);

  // ── Markers and the line between them ──────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (map === null) return;

    const place = (key: MarkerKey, point: Coordinates | null, element: () => HTMLElement, label: string) => {
      const existing = markersRef.current[key];

      if (point === null) {
        existing?.remove();
        markersRef.current[key] = null;
        return;
      }

      if (existing === null) {
        const node = element();
        node.title = label;
        node.setAttribute("aria-label", label);

        markersRef.current[key] = new maplibregl.Marker({
          element: node,
          anchor: key === "rider" ? "center" : "bottom",
        })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
        return;
      }

      existing.getElement().title = label;
      existing.getElement().setAttribute("aria-label", label);

      // The rider slides; the two ends of the job only ever jump, and rarely.
      if (key !== "rider") {
        existing.setLngLat([point.longitude, point.latitude]);
      }
    };

    place("pickup", pickup, () => pinElement("pickup"), "Business");
    place("destination", destination, () => pinElement("destination"), "Your address");
    place("rider", rider, riderElement, riderName ?? "Your rider");

    // The straight line is honestly a straight line — it is the distance left,
    // not a route. Drawing a fake road here would be a promise the app cannot
    // keep, so it is dashed rather than solid.
    const redrawLeg = (from: Coordinates | null) => {
      legRef.current = from !== null && destination !== null ? [from, destination] : null;

      // Before the style is ready there is nowhere to add a layer; `style.load`
      // draws the latest leg once it is.
      if (styleReadyRef.current) {
        drawLeg(map, legRef.current);
      }
    };

    cancelAnimationFrame(glideFrameRef.current);

    if (rider === null) {
      riderDrawnRef.current = null;
      redrawLeg(null);
    } else {
      // The first fix is a jump by definition — there is nowhere to slide from.
      const start = riderDrawnRef.current ?? rider;
      const startedAt = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / GLIDE_MS);
        // Ease-out: quick to respond, gentle to arrive.
        const eased = t * (2 - t);
        const at = {
          latitude: start.latitude + (rider.latitude - start.latitude) * eased,
          longitude: start.longitude + (rider.longitude - start.longitude) * eased,
        };

        riderDrawnRef.current = at;
        markersRef.current.rider?.setLngLat([at.longitude, at.latitude]);
        redrawLeg(at);

        if (t < 1) {
          glideFrameRef.current = requestAnimationFrame(step);
        }
      };

      glideFrameRef.current = requestAnimationFrame(step);
    }

    const known = [pickup, destination, rider].filter((point): point is Coordinates => point !== null);

    if (known.length === 0) return;

    if (!fittedRef.current) {
      // The first frame shows the whole job — where it came from, where it is
      // going, and where the rider is between them.
      const bounds = new maplibregl.LngLatBounds();
      for (const point of known) bounds.extend([point.longitude, point.latitude]);

      map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
      fittedRef.current = true;
      return;
    }

    // After that the rider leads. Panning only when they leave the middle of
    // the frame means a reader who has dragged the map to look at something is
    // not yanked back every few seconds.
    if (rider !== null && !insideInnerFrame(map, rider)) {
      map.panTo([rider.longitude, rider.latitude]);
    }
  }, [pickup, destination, rider, riderName]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle",
        className,
      )}
    >
      <div ref={containerRef} className="h-full w-full" aria-label="Live delivery map" role="application" />
    </div>
  );
}

/** Adds the dashed rider-to-door line if missing, then sets its two ends. */
function drawLeg(map: maplibregl.Map, leg: [Coordinates, Coordinates] | null): void {
  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: leg === null ? [] : leg.map((point) => [point.longitude, point.latitude]),
    },
  };

  const source = map.getSource<GeoJSONSource>(ROUTE_SOURCE);

  if (source !== undefined) {
    source.setData(data);
    return;
  }

  map.addSource(ROUTE_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: ROUTE_LAYER,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round" },
    paint: {
      "line-color": "#22d3ee",
      "line-width": 3,
      "line-opacity": 0.85,
      "line-dasharray": [2, 2.5],
    },
  });
}

/** Whether a point sits inside the middle 60% of the visible map. */
function insideInnerFrame(map: maplibregl.Map, point: Coordinates): boolean {
  const bounds = map.getBounds();
  const lngPad = (bounds.getEast() - bounds.getWest()) * 0.2;
  const latPad = (bounds.getNorth() - bounds.getSouth()) * 0.2;

  return (
    point.longitude > bounds.getWest() + lngPad &&
    point.longitude < bounds.getEast() - lngPad &&
    point.latitude > bounds.getSouth() + latPad &&
    point.latitude < bounds.getNorth() - latPad
  );
}

/** A teardrop pin, coloured by which end of the run it marks. */
function pinElement(kind: "pickup" | "destination"): HTMLElement {
  const colour = kind === "pickup" ? "#ff8a3d" : "#8b5cf6";
  const element = document.createElement("div");

  // The rotated square's tip is its bottom-left corner; nudging it right by
  // its own half-width puts the tip at the element's bottom centre, which is
  // where the `bottom` anchor pins it to the coordinate.
  element.innerHTML = `
    <span style="
      display:block;width:20px;height:20px;border-radius:50% 50% 50% 0;
      transform:translate(10px, -3px) rotate(-45deg);transform-origin:0 100%;background:${colour};
      border:2px solid #ffffff;box-shadow:0 2px 6px rgb(3 18 32 / 0.4);
    "></span>`;
  element.style.width = "20px";
  element.style.height = "20px";

  return element;
}

/** The rider: a pulsing dot, so a still map still reads as live. */
function riderElement(): HTMLElement {
  const element = document.createElement("div");

  element.innerHTML = `
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
    </style>`;

  return element;
}
