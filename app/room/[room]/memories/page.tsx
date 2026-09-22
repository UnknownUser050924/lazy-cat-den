"use client";

import Link from "next/link";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import type { Memory } from "@/lib/types";

const PLACE: Record<string, string> = {
  joined: "",
  "first-question": "qa",
  question: "qa",
  "first-answer": "qa",
  answer: "qa",
  "first-draw": "draw",
  draw: "draw",
  "first-note": "",
  note: "",
  "first-letter": "letter",
  letter: "letter",
  "letter-open": "letter",
  "first-chat": "chat",
  chat: "chat",
  wish: "wishlist",
  "cat-100": "cat",
  pat: "cat",
  gift: "corner",
  pocket: "corner",
  know: "corner",
  today: "today",
  event: "calendar",
};

function memoryHref(roomId: string, memory: Memory) {
  const place = memory.place ?? PLACE[memory.kind] ?? "";
  const base = `/room/${encodeURIComponent(roomId)}`;
  return place ? `${base}/${place}` : base;
}

export default function MemoriesPage() {
  const { room, roomId } = useRoomContext();
  if (!room) return <p className="text-center text-muted">翻开故事…</p>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">我们的小故事</h1>
        <p className="text-sm text-muted">点一下，就会走到那一页</p>
      </header>
      {room.memories.length === 0 ? <p className="text-sm text-muted">故事会在你们使用小屋时自己长出来。</p> : null}
      <ol className="space-y-3">
        {room.memories.map((memory) => (
          <li key={memory.id}>
            <Link href={memoryHref(roomId, memory)} className="card block rounded-2xl px-4 py-3">
              <p className="font-bold">{memory.titleZh}</p>
              <p className="text-xs text-muted">
                {memory.titleEn}
                {memory.actor ? ` · ${memory.actor}` : ""} · {formatTime(memory.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
