"use client";

import { useState } from "react";
import { CatMascot, moodLabel } from "@/components/CatMascot";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function CatPage() {
  const { room, act, busy } = useRoomContext();
  const [patted, setPatted] = useState(false);

  if (!room) return <p className="text-center text-muted">猫在被子里…</p>;

  const label = moodLabel(room.cat.mood);

  async function pat() {
    setPatted(true);
    await act({ type: "pat" });
    setTimeout(() => setPatted(false), 450);
  }

  return (
    <div className="space-y-5 text-center">
      <header>
        <h1 className="text-2xl font-extrabold">懒猫 The cat</h1>
        <p className="text-sm text-muted">今天摸摸它，它就会记得你们来过</p>
      </header>
      <section className="card rounded-[28px] px-4 pb-6 pt-3">
        <CatMascot mood={room.cat.mood} patted={patted} onPat={pat} />
        <p className="text-lg font-extrabold">
          {label.zh} · {label.en}
        </p>
        <div className="mx-auto mt-3 h-3 w-56 overflow-hidden rounded-full bg-blush">
          <div
            className="h-full rounded-full bg-rose transition-all"
            style={{ width: `${room.cat.mood}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">{room.cat.mood}/100</p>
        <button
          disabled={busy}
          onClick={pat}
          className="soft-btn mt-4 rounded-full bg-rose-deep px-8 py-3 font-bold text-white disabled:opacity-60"
        >
          摸摸猫 Pat
        </button>
      </section>
      <section className="card rounded-[24px] p-4 text-left">
        <h2 className="font-bold">谁摸过 Who patted</h2>
        { (room.pats ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted">还没有人摸。Pat the cat and it will show up here.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {(room.pats ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-bold">{item.name}</span>
                <span className="text-muted">{formatTime(item.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card rounded-[24px] p-4 text-left text-sm text-muted">
        <p>上次被摸 {room.cat.lastPat ? formatTime(room.cat.lastPat) : "还没有 never"}</p>
        <p className="mt-1">
          上次有人进小屋 {room.cat.lastCheckin ? formatTime(room.cat.lastCheckin) : "—"}
        </p>
        <p className="mt-3">
          如果一整天都没人来，心情会慢慢掉下来。打开小屋或摸摸它，它就会开心一点。
        </p>
      </section>
    </div>
  );
}
