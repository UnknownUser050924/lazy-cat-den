"use client";

import { useRoomContext } from "@/components/RoomShell";
import { useNow } from "@/lib/use-now";

export function SyncBoard() {
  const { room, displayName, act, busy } = useRoomContext();
  const now = useNow(1000);
  const game = room?.games?.active;
  if (!game || game.gameType !== "sync") return null;
  const mine = game.answers[displayName];
  const waiting = game.players.filter((player) => !game.submitted.includes(player));
  const left = game.deadline ? Math.max(0, Math.ceil((game.deadline - now) / 1000)) : 0;

  return (
    <section className="card rounded-[28px] px-4 py-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-extrabold text-ink">第 {game.round} 题</p>
        <p className="text-right text-muted">
          {game.status === "answering" ? `还剩 ${left} 秒` : game.status === "reveal" ? "揭晓了" : "这局结束"}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">答案相同的人各得 1 分。先到 3 分。后来的人可以加入下一题。</p>
      <p className="mt-2 text-sm font-bold text-ink">
        {game.players.map((player) => `${player} ${game.scores[player] ?? 0}`).join(" · ")}
      </p>

      <article className="mt-4 rounded-[24px] bg-blush/50 px-4 py-6 text-center">
        <p className="text-lg font-extrabold leading-relaxed text-ink">{game.promptZh}</p>
      </article>

      {game.status === "answering" ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {game.options.map((option) => (
              <button
                key={option}
                type="button"
                disabled={busy || Boolean(mine)}
                onClick={() => act({ type: "submitSync", answer: option })}
                className={`min-h-12 rounded-2xl px-3 py-3 text-sm font-bold disabled:opacity-70 ${
                  mine === option ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {game.players.map((player) => (
              <li key={player} className="rounded-2xl bg-card px-3 py-2 text-center text-sm text-ink">
                <span className="block font-bold">{player === displayName ? `${player}（我）` : player}</span>
                <span className="text-xs text-muted">{game.submitted.includes(player) ? "已答好" : "还在想"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-sm text-muted">{mine ? (waiting.length ? `等 ${waiting.join("、")}` : "马上揭晓") : "先选一个，别人现在看不到"}</p>
        </>
      ) : null}

      {game.status === "reveal" || game.status === "done" ? (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {game.players.map((player) => (
            <li key={player} className="rounded-[22px] bg-blush/60 px-4 py-4 text-center text-ink">
              <p className="font-bold">{player === displayName ? `${player}（我）` : player}</p>
              <p className="mt-2 text-sm leading-relaxed">{game.answers[player] || "没赶上这题"}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {game.status === "done" ? <p className="mt-4 text-center text-lg font-extrabold">{game.winner ? `${game.winner} 赢了` : "平手"}</p> : null}

      <div className="mt-4 flex justify-center gap-2">
        {game.status === "reveal" ? (
          <button type="button" disabled={busy} onClick={() => act({ type: "nextSync" })} className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            下一题
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
