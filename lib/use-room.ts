"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientAction, Room } from "./types";

export function useRoom(roomId: string, displayName: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Could not load room");
    const data = (await res.json()) as Room;
    setRoom(data);
    setError(null);
    return data;
  }, [roomId]);

  const act = useCallback(
    async (action: ClientAction) => {
      if (!displayName) throw new Error("Join the room first");
      setBusy(true);
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...action, displayName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        setRoom(data as Room);
        setError(null);
        return data as Room;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [displayName, roomId],
  );

  useEffect(() => {
    let cancelled = false;
    refresh().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Could not load room");
      }
    });
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!displayName) return;
    const key = `checkin:${roomId}:${displayName}`;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    act({ type: "checkin" }).catch(() => undefined);
    // first check-in only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, roomId]);

  return { room, error, busy, refresh, act, setError };
}
