"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavDrawer } from "@/components/NavDrawer";
import { TopBar } from "@/components/TopBar";
import { navHints } from "@/lib/activity";
import { isForcedOut, slugifyRoom } from "@/lib/constants";
import { peopleLine, skyPhase } from "@/lib/cottage";
import { clearSession, readSession, writeSession } from "@/lib/session";
import { useRoom } from "@/lib/use-room";
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
  refresh: () => Promise<Room>;
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
      <div className="min-h-dvh">
        <TopBar
          room={roomId}
          name={name}
          presence={presence}
          hints={hints}
          admin={roomState.admin}
          now={now}
          menuOpen={menu}
          onOpenMenu={() => setMenu(true)}
        />
        <main className="mx-auto w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
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
