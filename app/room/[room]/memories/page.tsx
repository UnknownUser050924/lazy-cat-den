"use client";

import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function MemoriesPage() {
  const { room } = useRoomContext();
  if (!room) return <p className="text-center text-muted">翻开故事…</p>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">我们的小故事</h1>
        <p className="text-sm text-muted">{room.memories.length} moments</p>
      </header>
      {room.memories.length === 0 ? <p className="text-sm text-muted">故事会在你们使用小屋时自己长出来。</p> : null}
      <ol className="space-y-3">
        {room.memories.map((memory) => (
          <li key={memory.id} className="card rounded-2xl px-4 py-3">
            <p className="font-bold">{memory.titleZh}</p>
            <p className="text-xs text-muted">
              {memory.titleEn}
              {memory.actor ? ` · ${memory.actor}` : ""} · {formatTime(memory.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
