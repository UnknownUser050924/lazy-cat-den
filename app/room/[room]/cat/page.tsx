"use client";

import { useState } from "react";
import { CatMascot, moodLabel } from "@/components/CatMascot";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import { catPose, catSpeech, skyPhase } from "@/lib/cottage";
import type { CatPose } from "@/lib/cottage";
import { useNow } from "@/lib/use-now";

export default function CatPage() {
  const { room, displayName, act, busy, error } = useRoomContext();
  const [patted, setPatted] = useState(false);
  const [actPose, setActPose] = useState<CatPose | null>(null);
  const [actLine, setActLine] = useState("");
  const now = useNow();

  if (!room) return <p className="text-center text-muted">猫在被子里…</p>;

  const sky = skyPhase(now);
  const label = moodLabel(room.cat.mood);
  const speech = catSpeech(room, sky, displayName, now);
  const pose = actPose ?? (patted ? "happy" : catPose(room, sky, now));

  async function pat() {
    setPatted(true);
    await act({ type: "pat" });
    setTimeout(() => setPatted(false), 700);
  }

  async function play(kind: "playToy" | "feedCat") {
    setActPose(kind === "playToy" ? "playing" : "eating");
    setActLine(kind === "playToy" ? "抓到了！" : "吃饱啦 ♡");
    try {
      await act({ type: kind });
    } catch (err) {
      setActLine(err instanceof Error ? err.message : "等一下");
    }
    setTimeout(() => {
      setActPose(null);
      setActLine("");
    }, 2400);
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 text-center">
      <header>
        <h1 className="text-2xl font-extrabold">懒猫 The cat</h1>
        <p className="text-sm text-muted">今天摸摸它，它就会记得你们来过</p>
      </header>
      <section className="card rounded-[28px] px-4 pb-6 pt-3">
        <CatMascot pose={pose} patted={patted || actPose === "playing"} onPat={pat} />
        <p className="text-lg font-extrabold">{actLine || speech.zh}</p>
        <p className="text-xs text-muted">{actLine ? "" : speech.en}</p>
        <p className="mt-2 text-sm font-bold">{label.zh}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => play("playToy")}
            className="rounded-full bg-blush px-5 py-2 text-sm font-bold text-rose-deep disabled:opacity-60"
          >
            玩具
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => play("feedCat")}
            className="rounded-full bg-blush px-5 py-2 text-sm font-bold text-rose-deep disabled:opacity-60"
          >
            喂猫
          </button>
        </div>
        <button
          disabled={busy}
          onClick={pat}
          className="soft-btn mt-3 rounded-full bg-rose-deep px-8 py-3 font-bold text-white disabled:opacity-60"
        >
          摸摸猫 Pat
        </button>
        {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
      </section>
      <section className="card rounded-[24px] p-4 text-left">
        <h2 className="font-bold">谁摸过 Who patted</h2>
        {(room.pats ?? []).length === 0 ? (
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
