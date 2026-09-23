"use client";

import { useEffect } from "react";
import { RPS_PICKS } from "@/lib/games";
import { useRoomContext } from "@/components/RoomShell";
import type { RpsPick } from "@/lib/types";

export default function GamesPage() {
  const { room, displayName, act, busy, error, setError } = useRoomContext();

  useEffect(() => {
    if (!room || !displayName) return;
    const game = room.games?.active;
    if (!game || game.status === "done") return;
    if (game.players.includes(displayName)) return;
    act({ type: "joinRps" }).catch(() => undefined);
  }, [act, displayName, room]);

  if (!room) return <p className="text-center text-muted">打开游戏机…</p>;

  const game = room.games?.active ?? null;
  const names = [...new Set(room.members.map((member) => member.displayName))];
  const playing = Boolean(game && game.status !== "done");
  const inGame = Boolean(game && game.players.includes(displayName));

  async function start() {
    setError(null);
    if (game?.status === "done") await act({ type: "clearRps" });
    await act({ type: "startRps" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">一起玩</h1>
        <p className="text-sm text-muted">谁在小屋里谁都能玩，选完才揭晓</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || playing || names.length < 2}
          onClick={start}
          className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          开始一局
        </button>
        {playing ? (
          <a href="#board" className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
            继续这一局
          </a>
        ) : null}
        {game ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act({ type: "clearRps" })}
            className="rounded-full px-4 py-2 text-sm font-bold text-muted"
          >
            结束这局
          </button>
        ) : null}
      </div>

      {names.length < 2 ? <p className="text-sm text-muted">等另一个人走进小屋，就可以一起玩。</p> : null}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      <section>
        <h2 className="text-sm font-bold text-rose-deep">快速对战</h2>
        <button
          type="button"
          disabled={busy || playing || names.length < 2}
          onClick={start}
          className="card mt-2 w-full rounded-3xl px-4 py-4 text-left disabled:opacity-70"
        >
          <p className="font-extrabold">石头剪刀布</p>
          <p className="text-xs text-muted">
            {names.length < 2 ? "等另一个人来" : `在线的人一起玩，后来的人也能加入 · 先到 2 分`}
          </p>
        </button>
      </section>

      {game ? <Board inGame={inGame} /> : null}

      {room.games?.recent?.length ? (
        <section>
          <h2 className="text-sm font-bold">最近一局</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {room.games.recent.slice(0, 3).map((item) => (
              <li key={item.id}>{item.titleZh}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Board({ inGame }: { inGame: boolean }) {
  const { room, displayName, act, busy } = useRoomContext();
  const game = room?.games?.active;
  if (!game) return null;

  const mine = game.picks[displayName];
  const revealed = game.status !== "picking";
  const waiting = game.players.filter((player) => !game.locked.includes(player));

  async function choose(pick: RpsPick) {
    await act({ type: "lockRps", pick });
  }

  return (
    <section id="board" className="card rounded-[28px] px-4 py-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-extrabold">第 {game.round} 回合</p>
        <p className="text-right text-muted">{game.players.map((player) => `${player} ${game.scores[player] ?? 0}`).join(" · ")}</p>
      </div>

      {game.status === "done" ? (
        <p className="mt-4 text-center text-lg font-extrabold">{game.winner} 赢了</p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {game.players.map((player) => {
          const pick = RPS_PICKS.find((item) => item.id === game.picks[player]);
          const locked = game.locked.includes(player);
          return (
            <li key={player} className="flex items-center justify-between rounded-2xl bg-blush/60 px-4 py-3">
              <span className="font-bold">{player === displayName ? `${player}（我）` : player}</span>
              <span className="text-sm">
                {revealed ? (pick ? `${pick.mark} ${pick.zh}` : "—") : locked ? "已选好" : "还在选"}
              </span>
            </li>
          );
        })}
      </ul>

      {game.status === "picking" && inGame && !mine ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {RPS_PICKS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              onClick={() => choose(item.id)}
              className="rounded-2xl bg-blush px-2 py-4 text-center text-rose-deep disabled:opacity-70"
            >
              <span className="block text-2xl" aria-hidden>
                {item.mark}
              </span>
              <span className="text-sm font-bold">{item.zh}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-center text-sm text-muted">
        {game.status === "done"
          ? "这局结束啦"
          : game.status === "reveal"
            ? "揭晓了"
              : mine
              ? waiting.length
                ? `等 ${waiting.join("、")} 选`
                : "马上揭晓"
              : inGame
                ? "选一个，别人现在看不到"
                : game.status === "picking"
                  ? "正在加入这局…"
                  : "这一回合已经出完了，下一回合可以加入"}
      </p>

      <div className="mt-4 flex justify-center gap-2">
        {game.status === "reveal" ? (
          <button type="button" disabled={busy} onClick={() => act({ type: "nextRps" })} className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            下一回合
          </button>
        ) : null}
        {game.status === "done" ? (
          <button type="button" disabled={busy} onClick={() => act({ type: "clearRps" })} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep disabled:opacity-60">
            收起这局
          </button>
        ) : null}
      </div>
    </section>
  );
}
