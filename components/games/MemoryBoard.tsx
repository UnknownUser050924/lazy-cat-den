"use client";

import { useRoomContext } from "@/components/RoomShell";
import { pairLabel } from "@/lib/games";
import { useNow } from "@/lib/use-now";

export function MemoryBoard() {
  const { room, displayName, act, busy } = useRoomContext();
  const now = useNow(1000);
  const game = room?.games?.active;
  if (!game || game.gameType !== "memory") return null;
  const myTurn = game.turn === displayName && game.status === "turn";
  const left = game.deadline ? Math.max(0, Math.ceil((game.deadline - now) / 1000)) : 0;

  return (
    <section className="card rounded-[28px] px-4 py-5">
      <p className="text-center text-lg font-extrabold text-ink">
        {game.status === "done" ? "这局结束" : `现在轮到 ${game.turn}`}
      </p>
      <p className="mt-1 text-center text-sm text-muted">
        {game.status === "peek" ? "看清楚这两张" : game.status === "turn" ? `翻对了再来一次 · 这手还剩 ${left} 秒` : game.winner ? `${game.winner} 赢了` : "平手"}
      </p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {game.players.map((player) => (
          <li
            key={player}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              player === game.turn && game.status !== "done" ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"
            }`}
          >
            {player} {game.scores[player] ?? 0}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-4 grid w-full max-w-xl grid-cols-4 gap-2">
        {game.cards.map((card) => {
          const open = card.face !== "down";
          return (
            <button
              key={card.id}
              type="button"
              disabled={busy || !myTurn || open}
              onClick={() => act({ type: "flipMemory", cardId: card.id })}
              className={`mem-card rounded-2xl border px-1 text-center text-sm font-extrabold disabled:opacity-100 ${
                card.face === "matched"
                  ? "border-rose bg-blush text-rose-deep"
                  : open
                    ? "border-[var(--line)] bg-card text-ink"
                    : "border-[var(--line)] bg-[color-mix(in_srgb,var(--blush)_35%,var(--card))] text-rose-deep"
              }`}
            >
              {open ? pairLabel(card.pair) : "牌"}
            </button>
          );
        })}
      </div>

      {game.status === "done" ? (
        <div className="mt-4 flex justify-center">
          <button type="button" disabled={busy} onClick={() => act({ type: "clearRps" })} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep disabled:opacity-60">
            收起这局
          </button>
        </div>
      ) : null}
    </section>
  );
}
