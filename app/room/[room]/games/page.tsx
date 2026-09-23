"use client";

import { useEffect, useState } from "react";
import { IconBrush, IconCards, IconHands, IconRps } from "@/components/NavIcons";
import { Page } from "@/components/Page";
import { DrawBoard } from "@/components/games/DrawBoard";
import { MemoryBoard } from "@/components/games/MemoryBoard";
import { RpsBoard } from "@/components/games/RpsBoard";
import { SyncBoard } from "@/components/games/SyncBoard";
import { useRoomContext } from "@/components/RoomShell";
import { gameTitle } from "@/lib/games";
import type { GameKind } from "@/lib/types";

const CARDS: {
  id: GameKind;
  zh: string;
  text: string;
  players: string;
  action: string;
  icon: typeof IconRps;
}[] = [
  {
    id: "rps",
    zh: "石头剪刀布",
    text: "大家一起出拳，选完才揭晓。先到 2 分。",
    players: "2人以上",
    action: "开始",
    icon: IconRps,
  },
  {
    id: "sync",
    zh: "默契挑战",
    text: "同一道题，先悄悄答。大家都答完或时间到了再一起揭晓。答案相同的人各得 1 分，先到 3 分。",
    players: "2人以上",
    action: "开始",
    icon: IconHands,
  },
  {
    id: "memory",
    zh: "记忆翻牌",
    text: "同一块牌面，轮流翻两张。翻对再来一次，翻错就换人。",
    players: "2人以上",
    action: "开始",
    icon: IconCards,
  },
  {
    id: "draw",
    zh: "你画我猜",
    text: "轮流画画。只有画画的人看见词，别人来猜。猜中画画的人和猜对的人都有分。",
    players: "2人以上",
    action: "进入",
    icon: IconBrush,
  },
];

export default function GamesPage() {
  const { room, displayName, act, busy, error, setError } = useRoomContext();
  const [picked, setPicked] = useState<GameKind>("rps");

  const game = room?.games?.active ?? null;
  const playing = Boolean(game && game.status !== "done");
  const names = room ? [...new Set(room.members.map((member) => member.displayName))] : [];

  useEffect(() => {
    if (!room || !displayName || !game || game.status === "done") return;
    if (game.players.includes(displayName)) return;
    act({ type: "joinGame" }).catch(() => undefined);
  }, [act, displayName, game, room]);

  useEffect(() => {
    if (game?.gameType) setPicked(game.gameType);
  }, [game?.gameType]);

  if (!room) return <p className="text-center text-muted">打开游戏机…</p>;

  async function start(kind: GameKind) {
    setError(null);
    if (game?.status === "done") await act({ type: "clearRps" });
    await act({ type: "startGame", gameType: kind });
  }

  return (
    <Page width="wide" className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">一起玩</h1>
        <p className="text-sm text-muted">选一种玩法。谁在小屋里谁都能加入，一局只开一种。</p>
      </header>

      {names.length < 2 ? <p className="text-sm text-muted">等另一个人走进小屋，就可以一起玩。</p> : null}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 @min-[36rem]:grid-cols-2">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const active = game?.gameType === card.id && game.status !== "done";
          const selected = picked === card.id;
          return (
            <article
              key={card.id}
              className={`game-soft card rounded-[24px] px-4 py-4 ${
                active ? "ring-2 ring-rose-deep" : selected ? "border-rose bg-[color-mix(in_srgb,var(--blush)_28%,var(--card))]" : ""
              }`}
            >
              <button type="button" className="w-full text-left" onClick={() => setPicked(card.id)}>
                <span className="flex items-start gap-3">
                  <span className="mt-0.5 text-rose-deep">
                    <Icon />
                  </span>
                  <span>
                    <span className="block font-extrabold text-ink">{card.zh}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{card.text}</span>
                    <span className="mt-2 block text-[11px] font-bold text-rose-deep">{card.players}</span>
                  </span>
                </span>
              </button>
              <div className="mt-3 flex gap-2">
                {active ? (
                  <a href="#board" className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
                    继续这一局
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={busy || playing || names.length < 2}
                    onClick={() => start(card.id)}
                    className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {card.action}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {game ? (
        <div id="board">
          {game.status !== "done" ? (
            <div className="mb-2 flex justify-end">
              <button type="button" disabled={busy} onClick={() => act({ type: "clearRps" })} className="text-xs font-bold text-muted">
                结束这局{gameTitle(game.gameType)}
              </button>
            </div>
          ) : null}
          {game.gameType === "rps" ? <RpsBoard /> : null}
          {game.gameType === "sync" ? <SyncBoard /> : null}
          {game.gameType === "memory" ? <MemoryBoard /> : null}
          {game.gameType === "draw" ? <DrawBoard /> : null}
        </div>
      ) : null}

      {room.games?.recent?.length ? (
        <section>
          <h2 className="text-sm font-bold text-ink">最近一局</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {room.games.recent.slice(0, 3).map((item) => (
              <li key={item.id}>{item.titleZh}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </Page>
  );
}
