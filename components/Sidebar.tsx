"use client";

import { RoomNav } from "@/components/RoomNav";

export function Sidebar({
  room,
  presence,
  hints,
  admin = false,
}: {
  room: string;
  presence: string;
  hints: { qa: boolean; games: boolean; letter: boolean; letterCount: number };
  admin?: boolean;
}) {
  return (
    <aside className="room-nav sticky top-0 hidden h-dvh max-h-dvh w-[var(--nav)] shrink-0 flex-col self-start overflow-hidden border-r border-[var(--line)] px-3 py-4 text-ink lg:flex">
      <RoomNav room={room} presence={presence} hints={hints} admin={admin} />
    </aside>
  );
}
