"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavDrawer } from "@/components/NavDrawer";
import { Sidebar } from "@/components/Sidebar";
import { IconMenu } from "@/components/NavIcons";
import { navHints } from "@/lib/activity";
import { isForcedOut, slugifyRoom } from "@/lib/constants";
import { peopleLine, skyPhase } from "@/lib/cottage";
import { clearSession, readSession, writeSession } from "@/lib/session";
import { useRoom } from "@/lib/use-room";
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

const EMPTY_HINTS = { qa: false, games: false, letter: false, letterCount: 0 };

export function RoomShell({
  room: roomId,
  children,
}: {
  room: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const now = useNow();
  const roomState = useRoom(roomId, name);
  const closeMenu = useCallback(() => setMenu(false), []);

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

  const hints = roomState.room ? navHints(roomState.room, name) : EMPTY_HINTS;
  const presence = roomState.room ? peopleLine(roomState.room.members, name, now) : "正在看看谁在这儿";

  return (
    <RoomContext.Provider
      value={{
        roomId,
        displayName: name,
        ...roomState,
      }}
    >
      <div className="min-h-dvh lg:flex lg:items-start">
        <Sidebar room={roomId} presence={presence} hints={hints} admin={roomState.admin} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--cream)_90%,transparent)] px-3 py-2.5 text-ink backdrop-blur-md sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-ink hover:bg-blush/60 lg:hidden"
                aria-label="打开菜单"
                aria-expanded={menu}
                aria-controls="room-nav-drawer"
                onClick={() => setMenu(true)}
              >
                <IconMenu />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-wide lg:hidden">懒猫小屋</p>
                <p className="text-[11px] text-muted">
                  <time dateTime={new Date(now).toISOString()}>
                    {dateLabel(now)} · {clockLabel(now)}
                  </time>
                  <span className="text-ink"> · 你是 {name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {roomState.admin ? (
                <button
                  type="button"
                  onClick={() => router.push(`/room/${encodeURIComponent(roomId)}/keep`)}
                  className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs font-bold text-ink lg:hidden"
                >
                  看管
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs font-bold text-ink"
              >
                换房间
              </button>
            </div>
          </header>
          <main className="mx-auto w-full min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</main>
        </div>
      </div>
      <NavDrawer
        open={menu}
        onClose={closeMenu}
        room={roomId}
        presence={presence}
        hints={hints}
        admin={roomState.admin}
      />
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
