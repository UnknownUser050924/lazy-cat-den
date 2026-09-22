"use client";

import { useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import { DRAW_TYPES } from "@/lib/constants";

export default function DrawPage() {
  const { room, act, busy, error, setError } = useRoomContext();
  const [spinning, setSpinning] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  if (!room) return <p className="text-center text-muted">摇签筒…</p>;

  const members = [...new Set(room.members.map((m) => m.displayName))];

  async function draw(drawType: string) {
    if (drawType !== "tonight" && members.length < 2) {
      setError("再等一个人进小屋吧 Need two people first");
      return;
    }
    setError(null);
    setSpinning(drawType);
    setFlash(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const next = await act({ type: "draw", drawType });
    setFlash(next.draws[0]?.winner ?? null);
    setSpinning(null);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">抽签 Draw lots</h1>
        <p className="text-sm text-muted">懒得决定的时候，让小屋帮你们选</p>
      </header>
      {members.length < 2 ? (
        <p className="card rounded-2xl p-4 text-sm text-muted">
          现在小屋里还不够两个人。把邀请链接发给对方吧。
          {members.length ? ` 现在看到：${members.join("、")}` : ""}
        </p>
      ) : null}
      <button
        disabled={busy || spinning !== null}
        onClick={() => draw("tonight")}
        className="card soft-btn w-full rounded-[24px] p-4 text-left disabled:opacity-60"
      >
        <div className="font-bold">今晚做什么</div>
        <div className="text-xs text-muted">What should we do tonight</div>
        {spinning === "tonight" ? <p className="mt-2 text-xs text-rose">抽签中…</p> : null}
      </button>
      <div className="grid grid-cols-2 gap-3">
        {DRAW_TYPES.map((item) => (
          <button
            key={item.id}
            disabled={busy || spinning !== null}
            onClick={() => draw(item.id)}
            className="card soft-btn rounded-[24px] p-4 text-left disabled:opacity-60"
          >
            <div className="text-2xl">{item.emoji}</div>
            <div className="mt-2 font-bold">{item.zh}</div>
            <div className="text-xs text-muted">{item.en}</div>
            {spinning === item.id ? (
              <p className="mt-2 text-xs text-rose">抽签中… shuffling…</p>
            ) : null}
          </button>
        ))}
      </div>
      {flash ? (
        <div className="pop-in card rounded-[24px] p-5 text-center">
          <p className="text-sm text-muted">这次是</p>
          <p className="mt-1 text-3xl font-extrabold text-rose-deep">{flash}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <section>
        <h2 className="mb-3 font-bold">最近结果 History</h2>
        <div className="space-y-2">
          {room.draws.length === 0 ? (
            <p className="text-sm text-muted">还没抽过。No draws yet.</p>
          ) : (
            room.draws.map((item) => (
              <div key={item.id} className="card flex items-center justify-between rounded-2xl px-4 py-3">
                <div>
                  <p className="font-bold">{item.labelZh}</p>
                  <p className="text-xs text-muted">
                    {item.labelEn} · {formatTime(item.createdAt)}
                  </p>
                </div>
                <p className="font-extrabold text-rose-deep">{item.winner}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
