"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { navHints } from "@/lib/activity";
import { isForcedOut, slugifyRoom } from "@/lib/constants";
import { clearSession, readSession, writeSession } from "@/lib/session";
import { useRoom } from "@/lib/use-room";
import { skyPhase } from "@/lib/cottage";
import { dateLabel, clockLabel } from "@/lib/time";
import { useNow } from "@/lib/use-now";
import type { ClientAction, Room } from "@/lib/types";

type RoomContextValue = {
  roomId: string;
  displayName: string;
  room: Room | null;
  error: string | null;
  busy: boolean;
  admin: boolean;
  act: (action: ClientAction) => Promise<Room>;
  setError: (value: string | null) => void;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoomContext must be used in a room");
  return ctx;
}

export function RoomShell({
  room: roomId,
  children,
}: {
  room: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const now = useNow();
  const roomState = useRoom(roomId, name);

  useEffect(() => {
    document.documentElement.dataset.sky = skyPhase(now);
  }, [now]);

  useEffect(() => {
    const session = readSession();
    const id = slugifyRoom(roomId);
    if (!session || slugifyRoom(session.room) !== id) {
      router.replace(`/?room=${encodeURIComponent(id || roomId)}`);
      return;
    }
    writeSession({ room: id, displayName: session.displayName, claim: session.claim });
    setName(session.displayName);
  }, [roomId, router]);

  useEffect(() => {
    if (!isForcedOut(roomState.error)) return;
    clearSession();
    router.replace(`/?room=${encodeURIComponent(slugifyRoom(roomId) || roomId)}`);
  }, [roomId, roomState.error, router]);

  if (!name) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        正在走进小屋… slipping in…
      </div>
    );
  }

  const hints = roomState.room ? navHints(roomState.room, name) : { qa: false, games: false, letter: false };

  return (
    <RoomContext.Provider
      value={{
        roomId,
        displayName: name,
        ...roomState,
      }}
    >
      <div className="min-h-dvh md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:items-start xl:grid-cols-[15rem_minmax(0,1fr)]">
        <Sidebar room={roomId} hints={hints} admin={roomState.admin} />
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--cream)_88%,transparent)] px-4 py-3 text-ink backdrop-blur-md">
            <div>
              <p className="text-sm font-extrabold tracking-wide">懒猫小屋</p>
              <p className="text-[11px] text-muted">
                <time dateTime={new Date(now).toISOString()}>
                  {dateLabel(now)} · {clockLabel(now)}
                </time>
              </p>
              <p className="text-[11px] text-muted">
                {roomId} · 你是 {name}
                {roomState.room?.members.length
                  ? ` · ${roomState.room.members.map((member) => member.displayName).join("、")}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {roomState.admin ? (
                <button
                  type="button"
                  onClick={() => router.push(`/room/${encodeURIComponent(roomId)}/keep`)}
                  className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs text-muted md:hidden"
                >
                  看管
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push(`/room/${encodeURIComponent(roomId)}/corner`)}
                className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs text-muted md:hidden"
              >
                角落
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs text-muted"
              >
                换房间
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-4 md:max-w-none md:px-6 md:pb-10 xl:px-10">{children}</main>
          <BottomNav room={roomId} hints={hints} />
        </div>
      </div>
    </RoomContext.Provider>
  );
}

export function formatTime(ts: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
