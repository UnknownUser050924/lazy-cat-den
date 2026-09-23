"use client";

import { RPS_PICKS } from "@/lib/games";
import { useRoomContext } from "@/components/RoomShell";
import type { RpsPick } from "@/lib/types";

export function RpsBoard() {
  const { room, displayName, act, busy } = useRoomContext();
  const game = room?.games?.active;
  if (!game || game.gameType !== "rps") return null;
  const inGame = game.players.includes(displayName);
  const mine = game.picks[displayName];
  const revealed = game.status !== "picking";
  const waiting = game.players.filter((player) => !game.locked.includes(player));

  return (
    <section className="card rounded-[28px] px-4 py-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-extrabold text-ink">第 {game.round} 回合</p>
        <p className="text-right text-muted">
          {game.players.map((player) => `${player} ${game.scores[player] ?? 0}`).join(" · ")}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {game.status === "picking" ? "还在选" : game.status === "reveal" ? "揭晓了" : "这局结束"}
      </p>

      {game.status === "done" ? <p className="mt-4 text-center text-lg font-extrabold">{game.winner ? `${game.winner} 赢了` : "平手"}</p> : null}

      <ul className="mt-4 space-y-2">
        {game.players.map((player) => {
          const pick = RPS_PICKS.find((item) => item.id === game.picks[player]);
          const locked = game.locked.includes(player);
          return (
            <li key={player} className="flex items-center justify-between rounded-2xl bg-blush/60 px-4 py-3 text-ink">
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
              onClick={() => act({ type: "lockRps", pick: item.id as RpsPick })}
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
                : "正在加入这局…"}
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
