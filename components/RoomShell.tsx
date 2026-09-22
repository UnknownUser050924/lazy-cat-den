"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { readSession } from "@/lib/session";
import { useRoom } from "@/lib/use-room";
import type { ClientAction, Room } from "@/lib/types";

type RoomContextValue = {
  roomId: string;
  displayName: string;
  room: Room | null;
  error: string | null;
  busy: boolean;
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
  const roomState = useRoom(roomId, name);

  useEffect(() => {
    const session = readSession();
    if (!session || session.room !== roomId) {
      router.replace(`/?room=${encodeURIComponent(roomId)}`);
      return;
    }
    setName(session.displayName);
  }, [roomId, router]);

  if (!name) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        正在走进小屋… slipping in…
      </div>
    );
  }

  return (
    <RoomContext.Provider
      value={{
        roomId,
        displayName: name,
        ...roomState,
      }}
    >
      <div className="mx-auto min-h-dvh max-w-lg">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--cream)_88%,transparent)] px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-sm font-extrabold tracking-wide">懒猫小屋</p>
            <p className="text-[11px] text-muted">
              {roomId} · 你是 {name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-[var(--line)] bg-card px-3 py-1 text-xs text-muted"
          >
            换房间 Switch
          </button>
        </header>
        <main className="px-4 pb-28 pt-4">{children}</main>
        <BottomNav room={roomId} />
      </div>
    </RoomContext.Provider>
  );
}

export function formatTime(ts: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
