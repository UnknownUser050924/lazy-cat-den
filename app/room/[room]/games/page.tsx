"use client";

import { RPS_PICKS } from "@/lib/games";
import { partnerOf } from "@/lib/cottage";
import { useRoomContext } from "@/components/RoomShell";
import type { RpsPick } from "@/lib/types";

export default function GamesPage() {
  const { room, displayName, act, busy, error } = useRoomContext();

  if (!room) return <p className="text-center text-muted">打开游戏机…</p>;

  const game = room.games?.active ?? null;
  const partner = partnerOf(room, displayName);
  const playing = game && game.status !== "done";

  async function start() {
    if (game?.status === "done") await act({ type: "clearRps" });
    await act({ type: "startRps" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">一起玩</h1>
        <p className="text-sm text-muted">选一个小游戏，陪我玩一下</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || Boolean(playing)} onClick={start} className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          随机一局
        </button>
        {playing ? (
          <a href="#board" className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
            继续上一局
          </a>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      <section>
        <h2 className="text-sm font-bold text-rose-deep">快速对战</h2>
        <button type="button" disabled={busy || Boolean(playing)} onClick={start} className="card mt-2 w-full rounded-3xl px-4 py-4 text-left disabled:opacity-70">
          <p className="font-extrabold">石头剪刀布</p>
          <p className="text-xs text-muted">三局两胜 · {partner ? `和 ${partner.displayName}` : "等另一个人来"}</p>
        </button>
      </section>

      {game ? <Board /> : null}

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

function Board() {
  const { room, displayName, act, busy } = useRoomContext();
  const game = room?.games?.active;
  if (!game) return null;

  const mine = game.picks[displayName];
  const partnerName = game.players.find((player) => player !== displayName) ?? "";
  const partnerLocked = game.locked.includes(partnerName);
  const revealed = game.status !== "picking";

  async function choose(pick: RpsPick) {
    await act({ type: "lockRps", pick });
  }

  return (
    <section id="board" className="card rounded-[28px] px-4 py-5">
      <div className="flex items-center justify-between text-sm">
        <p className="font-extrabold">第 {game.round} 回合</p>
        <p className="text-muted">
          {game.players.map((player) => `${player} ${game.scores[player] ?? 0}`).join(" · ")}
        </p>
      </div>

      {game.status === "done" ? (
        <p className="mt-4 text-center text-lg font-extrabold">{game.winner} 赢了</p>
      ) : null}

      {revealed ? (
        <ul className="mt-4 space-y-2">
          {game.players.map((player) => {
            const pick = RPS_PICKS.find((item) => item.id === game.picks[player]);
            return (
              <li key={player} className="flex items-center justify-between rounded-2xl bg-blush/60 px-4 py-3">
                <span className="font-bold">{player}</span>
                <span>{pick ? `${pick.mark} ${pick.zh}` : "—"}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {RPS_PICKS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy || Boolean(mine)}
              onClick={() => choose(item.id)}
              className={`rounded-2xl px-2 py-4 text-center ${mine === item.id ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"} disabled:opacity-70`}
            >
              <span className="block text-2xl" aria-hidden>
                {item.mark}
              </span>
              <span className="text-sm font-bold">{item.zh}</span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-sm text-muted">
        {game.status === "done"
          ? "这局结束啦"
          : game.status === "reveal"
            ? "揭晓了"
            : mine
              ? partnerLocked
                ? "对方也选好了"
                : `等待${partnerName}选择…`
              : partnerLocked
                ? `${partnerName}选好了，轮到你`
                : "选一个，对方看不到"}
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
