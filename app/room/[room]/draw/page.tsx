"use client";

import { useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";

const JARS = [
  {
    id: "plan",
    zh: "今晚做什么",
    en: "What should we do",
    hint: "吃、看、玩、听，或者出门",
    needsTwo: false,
  },
  {
    id: "who",
    zh: "谁来决定",
    en: "Who decides",
    hint: "小屋里至少两个人才能抽",
    needsTwo: true,
  },
  {
    id: "sweet",
    zh: "来点甜的",
    en: "A little sweet thing",
    hint: "抱一下、亲亲、说一句喜欢",
    needsTwo: false,
  },
] as const;

export default function DrawPage() {
  const { room, act, error, setError } = useRoomContext();
  const [spinning, setSpinning] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ label: string; winner: string } | null>(null);

  if (!room) return <p className="text-center text-muted">摇签筒…</p>;

  const members = [...new Set(room.members.map((member) => member.displayName))];

  async function draw(drawType: string, needsTwo: boolean) {
    if (needsTwo && members.length < 2) {
      setError("再等一个人进小屋吧");
      return;
    }
    setError(null);
    setSpinning(drawType);
    setFlash(null);
    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      const next = await act({ type: "draw", drawType });
      const latest = next.draws[0];
      setFlash(latest ? { label: latest.labelZh, winner: latest.winner } : null);
    } finally {
      setSpinning(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">抽签</h1>
        <p className="text-sm text-muted">三个罐子，抽一下就好</p>
      </header>
      {members.length < 2 ? (
        <p className="rounded-[24px] bg-blush/70 px-4 py-3 text-sm text-rose-deep">
          谁来决定，要等再来一个人。另外两个罐子现在就能抽。
          {members.length ? ` 现在看到：${members.join("、")}` : ""}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {JARS.map((jar) => (
          <article key={jar.id} className="card flex flex-col rounded-[28px] p-4">
            <h2 className="text-lg font-extrabold">{jar.zh}</h2>
            <p className="text-xs text-muted">{jar.en}</p>
            <p className="mt-2 flex-1 text-sm text-muted">{jar.hint}</p>
            <button
              type="button"
              disabled={spinning !== null || (jar.needsTwo && members.length < 2)}
              onClick={() => draw(jar.id, jar.needsTwo)}
              className="soft-btn mt-4 rounded-full bg-rose-deep px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {spinning === jar.id ? "抽一下…" : "抽一下"}
            </button>
          </article>
        ))}
      </div>
      {flash ? (
        <div className="pop-in rounded-[28px] bg-blush px-5 py-6 text-center" aria-live="polite">
          <p className="text-sm text-muted">{flash.label}</p>
          <p className="mt-1 text-3xl font-extrabold text-rose-deep">{flash.winner}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <details className="rounded-[24px] border border-[var(--line)] bg-card px-4 py-3">
        <summary className="cursor-pointer font-bold">最近结果</summary>
        <div className="mt-3 space-y-2">
          {room.draws.length === 0 ? (
            <p className="text-sm text-muted">还没抽过。</p>
          ) : (
            room.draws.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold">{item.labelZh}</p>
                  <p className="text-xs text-muted">{formatTime(item.createdAt)}</p>
                </div>
                <p className="font-extrabold text-rose-deep">{item.winner}</p>
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}
