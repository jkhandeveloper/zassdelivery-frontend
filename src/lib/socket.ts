"use client";

import { io, type Socket } from "socket.io-client";

import {
  ClientEvents,
  ServerEvents,
  type ClientToServerEvents,
  type ReadyPayload,
  type ServerToClientEvents,
} from "@/lib/socket-events";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export type ZassSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline";

export interface RealtimeSnapshot {
  socket: ZassSocket | null;
  state: ConnectionState;
  /** From `connection:ready` — rooms the server joined us to unasked. */
  autoJoinedRooms: string[];
  /**
   * True when Socket.IO replayed what we missed rather than opening a fresh
   * session. §5.10: do not force a full resync when this is true.
   */
  recovered: boolean;
}

/**
 * One connection per session (§9), modelled as an external store.
 *
 * The connection is a genuinely external system, so React subscribes to it via
 * `useSyncExternalStore` rather than mirroring its status into component state
 * from an effect. That keeps every consumer re-rendering off one source of
 * truth instead of a ref that React cannot see change.
 */

const IDLE: RealtimeSnapshot = {
  socket: null,
  state: "idle",
  autoJoinedRooms: [],
  recovered: false,
};

let snapshot: RealtimeSnapshot = IDLE;
const listeners = new Set<() => void>();

/** Rooms currently being watched, reference-counted across components. */
const orderSubscriptions = new Map<string, number>();
const restaurantSubscriptions = new Map<string, number>();

function publish(next: Partial<RealtimeSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToRealtime(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getRealtimeSnapshot(): RealtimeSnapshot {
  return snapshot;
}

/** The server never has a connection, so SSR always renders the idle state. */
export function getRealtimeServerSnapshot(): RealtimeSnapshot {
  return IDLE;
}

/**
 * Opens the connection, or re-points an existing one at a new token.
 *
 * The gateway checks the access token against its revocation list on every
 * handshake, so a socket still holding a rotated token would be closed on its
 * next reconnect — updating `auth` here is what keeps it alive across refreshes.
 */
export function connectSocket(token: string): void {
  if (snapshot.socket !== null) {
    snapshot.socket.auth = { token };
    return;
  }

  const socket: ZassSocket = io(`${SOCKET_URL}/realtime`, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 8_000,
    reconnectionAttempts: Infinity,
  });

  socket.on(ServerEvents.ready, (payload: ReadyPayload) => {
    publish({
      state: "connected",
      autoJoinedRooms: payload.rooms,
      recovered: payload.recovered,
    });

    // A fresh session lost its rooms; rejoin everything still being watched.
    // A recovered one kept them, and re-subscribing would be pure noise.
    if (!payload.recovered) {
      for (const orderId of orderSubscriptions.keys()) {
        socket.emit(ClientEvents.orderSubscribe, { orderId }, () => {});
      }
      for (const restaurantId of restaurantSubscriptions.keys()) {
        socket.emit(ClientEvents.restaurantSubscribe, { restaurantId }, () => {});
      }
    }
  });

  // `connect` fires before the server's ready handshake; treat it as still
  // connecting so the UI does not claim to be live a beat early.
  socket.on("connect", () => publish({ state: "connecting" }));
  socket.on("disconnect", () => publish({ state: "reconnecting" }));
  socket.on("connect_error", () => publish({ state: "offline" }));

  publish({ socket, state: "connecting" });
  socket.connect();
}

export function disconnectSocket(): void {
  const current = snapshot.socket;

  if (current !== null) {
    current.removeAllListeners();
    current.disconnect();
  }

  orderSubscriptions.clear();
  restaurantSubscriptions.clear();
  snapshot = IDLE;

  for (const listener of listeners) {
    listener();
  }
}

// ── Reference-counted room subscriptions ─────────────────────
// Two components watching the same order share one room, and the room is only
// left when the last of them unmounts. Without this, closing one of two open
// order panels would silently stop updates for the other.

function acquire(counts: Map<string, number>, id: string): boolean {
  const next = (counts.get(id) ?? 0) + 1;
  counts.set(id, next);

  return next === 1;
}

function release(counts: Map<string, number>, id: string): boolean {
  const next = (counts.get(id) ?? 1) - 1;

  if (next > 0) {
    counts.set(id, next);
    return false;
  }

  counts.delete(id);
  return true;
}

export function joinOrderRoom(orderId: string): void {
  acquire(orderSubscriptions, orderId);
  snapshot.socket?.emit(ClientEvents.orderSubscribe, { orderId }, () => {});
}

export function leaveOrderRoom(orderId: string): void {
  if (release(orderSubscriptions, orderId)) {
    snapshot.socket?.emit(ClientEvents.orderUnsubscribe, { orderId }, () => {});
  }
}

export function joinRestaurantRoom(restaurantId: string): void {
  acquire(restaurantSubscriptions, restaurantId);
  snapshot.socket?.emit(ClientEvents.restaurantSubscribe, { restaurantId }, () => {});
}

export function leaveRestaurantRoom(restaurantId: string): void {
  if (release(restaurantSubscriptions, restaurantId)) {
    snapshot.socket?.emit(ClientEvents.restaurantUnsubscribe, { restaurantId }, () => {});
  }
}
