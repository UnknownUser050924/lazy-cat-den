"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@/components/RoomShell";
import { useNow } from "@/lib/use-now";
import type { DrawStroke } from "@/lib/types";

const COLORS = ["#4a3b36", "#c36b76", "#8a736c", "#2f5d50"];
const WIDTHS = [4, 8];

export function DrawBoard() {
  const { room, displayName, act, busy } = useRoomContext();
  const now = useNow(1000);
  const game = room?.games?.active;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<number[]>([]);
  const drawing = useRef(false);
  const [tool, setTool] = useState<"pen" | "erase">("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [guess, setGuess] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !game || game.gameType !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fffaf6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of game.strokes) paintStroke(ctx, stroke, canvas.width, canvas.height);
  }, [game]);

  if (!game || game.gameType !== "draw") return null;
  const artist = game.artist === displayName;
  const left = game.deadline ? Math.max(0, Math.ceil((game.deadline - now) / 1000)) : 0;
  const play = game.status === "play";

  function pos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const box = canvas.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 1000;
    const y = ((event.clientY - box.top) / box.height) * 1000;
    return [Math.round(x), Math.round(y)];
  }

  async function flushStroke() {
    if (points.current.length < 4) {
      points.current = [];
      return;
    }
    const stroke: DrawStroke = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      color,
      width,
      mode: tool,
      points: points.current,
    };
    points.current = [];
    await act({ type: "drawStroke", stroke });
  }

  return (
    <section className="card rounded-[28px] px-3 py-4 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-extrabold text-ink">
          第 {game.round} 回合 · {game.artist}在画
        </p>
        <p className="font-bold text-rose-deep">{game.status === "play" ? `还剩 ${left} 秒` : game.status === "reveal" ? "揭晓了" : "这局结束"}</p>
      </div>
      <p className="mt-1 text-sm text-ink">
        {game.status !== "play"
          ? `词是「${game.word ?? "—"}」`
          : artist
            ? `请画：${game.word}`
            : `${game.wordLen ?? 2} 个字。画画的人看不见猜。`}
      </p>
      <p className="text-xs text-muted">{game.players.map((player) => `${player} ${game.scores[player] ?? 0}`).join(" · ")}</p>

      <div className="mt-3 grid gap-3 @min-[44rem]:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.8fr)]">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!artist || !play}
              onClick={() => setTool("pen")}
              className={`rounded-full px-3 py-1 text-xs font-bold ${tool === "pen" ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"}`}
            >
              笔
            </button>
            <button
              type="button"
              disabled={!artist || !play}
              onClick={() => setTool("erase")}
              className={`rounded-full px-3 py-1 text-xs font-bold ${tool === "erase" ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"}`}
            >
              橡皮
            </button>
            {COLORS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={!artist || !play}
                onClick={() => {
                  setColor(item);
                  setTool("pen");
                }}
                aria-label={`颜色 ${item}`}
                className={`h-7 w-7 rounded-full border ${color === item && tool === "pen" ? "border-ink" : "border-[var(--line)]"}`}
                style={{ background: item }}
              />
            ))}
            {WIDTHS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={!artist || !play}
                onClick={() => setWidth(item)}
                className={`rounded-full px-2 py-1 text-[11px] font-bold ${width === item ? "bg-blush text-rose-deep" : "text-muted"}`}
              >
                {item === 4 ? "细" : "粗"}
              </button>
            ))}
            {artist && play ? (
              confirmClear ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await act({ type: "drawClear" });
                    setConfirmClear(false);
                  }}
                  className="rounded-full bg-rose-deep px-3 py-1 text-xs font-bold text-white"
                >
                  确定清空？
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} className="text-xs font-bold text-muted">
                  清空画布
                </button>
              )
            ) : null}
          </div>
          <canvas
            ref={canvasRef}
            width={1000}
            height={750}
            className="h-auto min-h-[16rem] w-full touch-none rounded-[24px] border border-[var(--line)] bg-[#fffaf6] @min-[40rem]:min-h-[22rem]"
            onPointerDown={(event) => {
              if (!artist || !play) return;
              drawing.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              const at = pos(event);
              if (at) points.current = [...at];
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return;
              const at = pos(event);
              if (!at) return;
              points.current.push(...at);
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (!canvas || !ctx || points.current.length < 4) return;
              paintStroke(
                ctx,
                { id: "live", color, width, mode: tool, points: points.current.slice(-6) },
                canvas.width,
                canvas.height,
              );
            }}
            onPointerUp={() => {
              if (!drawing.current) return;
              drawing.current = false;
              void flushStroke();
            }}
            onPointerCancel={() => {
              drawing.current = false;
              points.current = [];
            }}
          />
        </div>
        <div className="flex min-h-[12rem] flex-col rounded-[24px] bg-blush/40 px-3 py-3">
          <p className="text-sm font-bold text-ink">{artist ? "你在画，不能猜" : "猜一猜"}</p>
          {artist ? (
            <p className="mt-2 text-sm text-muted">别人的猜测会出现在这里。猜中会一起加分。</p>
          ) : play ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={async (event: FormEvent) => {
                event.preventDefault();
                if (!guess.trim()) return;
                await act({ type: "drawGuess", text: guess });
                setGuess("");
              }}
            >
              <input
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                placeholder="写下你猜的词"
                aria-label="猜测"
                className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-card px-3 py-2 text-sm text-ink outline-none"
              />
              <button disabled={busy} className="rounded-2xl bg-rose-deep px-3 text-sm font-bold text-white disabled:opacity-60">
                猜
              </button>
            </form>
          ) : null}
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {game.guesses.length === 0 ? <li className="text-muted">还没有猜测。</li> : null}
            {game.guesses.slice(-12).map((item, index) => (
              <li key={`${item.at}-${index}`} className={item.correct ? "font-extrabold text-rose-deep" : ""}>
                {item.by}：{item.text}
                {item.correct ? " · 猜中了" : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {game.status === "reveal" ? (
        <div className="mt-4 flex justify-center">
          <button type="button" disabled={busy} onClick={() => act({ type: "nextDraw" })} className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            下一轮
          </button>
        </div>
      ) : null}
      {game.status === "done" ? (
        <div className="mt-4 text-center">
          <p className="text-lg font-extrabold">{game.winner ? `${game.winner} 赢了` : "平手"}</p>
          <button type="button" disabled={busy} onClick={() => act({ type: "clearRps" })} className="mt-2 rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep disabled:opacity-60">
            收起这局
          </button>
        </div>
      ) : null}
    </section>
  );
}

function paintStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke, width: number, height: number) {
  if (stroke.points.length < 4) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = (stroke.width / 1000) * width;
  ctx.strokeStyle = stroke.color;
  ctx.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
  ctx.beginPath();
  ctx.moveTo((stroke.points[0] / 1000) * width, (stroke.points[1] / 1000) * height);
  for (let i = 2; i < stroke.points.length; i += 2) {
    ctx.lineTo((stroke.points[i] / 1000) * width, (stroke.points[i + 1] / 1000) * height);
  }
  ctx.stroke();
  ctx.restore();
}
