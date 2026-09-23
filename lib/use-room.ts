"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backupHasMore, readBackup, writeBackup } from "./backup";
import type { ClientAction, Room } from "./types";

export function useRoom(roomId: string, displayName: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const actSeq = useRef(0);
  const inflight = useRef(0);
  const restoring = useRef(false);

  const refresh = useCallback(async () => {
    const seen = revision.current;
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Could not load room");
    let data = (await res.json()) as Room;
    const backup = readBackup(roomId);
    if (backup && !restoring.current && backupHasMore(backup, data)) {
      restoring.current = true;
      try {
        const restored = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "restore",
            displayName: displayName || backup.members[0]?.displayName || "",
            room: backup,
          }),
        });
        if (restored.ok) data = (await restored.json()) as Room;
      } finally {
        restoring.current = false;
      }
    }
    const kept = readBackup(roomId);
    if (!kept || !backupHasMore(kept, data)) writeBackup(data);
    if (revision.current === seen) {
      setRoom(data);
      setError(null);
    }
    return data;
  }, [displayName, roomId]);

  const act = useCallback(
    async (action: ClientAction) => {
      if (!displayName) throw new Error("Join the room first");
      const mine = ++actSeq.current;
      inflight.current += 1;
      setBusy(true);
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...action, displayName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        revision.current += 1;
        const next = data as Room;
        if (actSeq.current === mine) {
          setRoom(next);
          const kept = readBackup(roomId);
          if (!kept || !backupHasMore(kept, next)) writeBackup(next);
          setError(null);
        }
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        if (actSeq.current === mine) setError(message);
        throw err;
      } finally {
        inflight.current -= 1;
        if (inflight.current <= 0) {
          inflight.current = 0;
          setBusy(false);
        }
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

  // Keep checking in until this person appears in the room member list.
  useEffect(() => {
    if (!displayName) return;
    let cancelled = false;

    async function ensurePresent() {
      try {
        const latest = room ?? (await refresh());
        if (cancelled) return;
        const listed = latest.members.some((m) => m.displayName === displayName);
        if (listed) return;
        await act({ type: "checkin" });
      } catch {
        // Retry on the next poll cycle.
      }
    }

    ensurePresent();
    const timer = setInterval(ensurePresent, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, roomId, room?.members.length]);

  return { room, error, busy, refresh, act, setError };
}
