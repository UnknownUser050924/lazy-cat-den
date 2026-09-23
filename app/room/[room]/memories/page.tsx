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
  "wish-done": "wishlist",
  "cat-100": "cat",
  pat: "cat",
  gift: "",
  pocket: "corner",
  know: "corner",
  today: "today",
  event: "calendar",
};

const MARK: Record<string, string> = {
  joined: "门",
  "first-chat": "话",
  "first-letter": "信",
  "first-draw": "签",
  "cat-100": "猫",
  "wish-done": "愿",
  gift: "心",
  letter: "信",
  draw: "签",
  pat: "猫",
  event: "历",
};

function memoryHref(roomId: string, memory: Memory) {
  const place = memory.place ?? PLACE[memory.kind] ?? "";
  const base = `/room/${encodeURIComponent(roomId)}`;
  return place ? `${base}/${place}` : base;
}

export default function MemoriesPage() {
  const { room, roomId } = useRoomContext();
  if (!room) return <p className="text-center text-muted">翻开故事…</p>;

  const featured = room.memories.find((memory) =>
    ["first-chat", "first-letter", "cat-100", "wish-done", "joined"].includes(memory.kind),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">我们的小故事</h1>
        <p className="text-sm text-muted">Our little story</p>
      </header>
      {featured ? (
        <Link href={memoryHref(roomId, featured)} className="block rounded-[28px] bg-blush px-5 py-5">
          <p className="text-xs font-bold tracking-[0.16em] text-rose">FEATURED</p>
          <p className="mt-2 text-xl font-extrabold">{featured.titleZh}</p>
          <p className="mt-1 text-xs text-muted">{formatTime(featured.createdAt)}</p>
        </Link>
      ) : null}
      {room.memories.length === 0 ? <p className="text-sm text-muted">故事会在有人使用小屋时自己长出来。</p> : null}
      <ol className="grid gap-3 sm:grid-cols-2">
        {room.memories.map((memory) => (
          <li key={memory.id}>
            <Link href={memoryHref(roomId, memory)} className="card block h-full rounded-[24px] px-4 py-3">
              <p className="text-xs text-rose">{MARK[memory.kind] ?? "记"}</p>
              <p className="mt-1 font-bold">{memory.titleZh}</p>
              <p className="mt-1 text-xs text-muted">
                {formatTime(memory.createdAt)}
                {memory.actor ? ` · ${memory.actor}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
