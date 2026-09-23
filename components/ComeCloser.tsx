"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@/components/RoomShell";
import { CLOSER_KINDS } from "@/lib/constants";
import { closerLine } from "@/lib/cottage";

export function ComeCloser({ partnerName }: { partnerName: string | null }) {
  const { room, displayName, act } = useRoomContext();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);
  const [note, setNote] = useState("");
  const [burst, setBurst] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!room || primed.current) return;
    for (const gift of room.gifts ?? []) seen.current.add(gift.id);
    primed.current = true;
  }, [room]);

  useEffect(() => {
    if (!room || !primed.current) return;
    const incoming = (room.gifts ?? []).find((gift) => gift.to === displayName && !seen.current.has(gift.id));
    if (!incoming) return;
    seen.current.add(incoming.id);
    setBurst(`${incoming.from}${closerLine(incoming.kind, incoming.note)} ♡`);
    const timer = setTimeout(() => setBurst(""), 2200);
    return () => clearTimeout(timer);
  }, [displayName, room]);

  function open() {
    setLocalError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function send(kind: string, event?: FormEvent) {
    event?.preventDefault();
    if (!partnerName) {
      setLocalError("等对方走进小屋");
      return;
    }
    const spec = CLOSER_KINDS.find((item) => item.id === kind);
    setBurst(`你${spec?.line ?? "靠近了一下"} ♡`);
    setTimeout(() => setBurst(""), 2200);
    try {
      const next = await act({
        type: "gift",
        target: partnerName,
        kind,
        note: kind === "note" ? note : undefined,
      });
      for (const gift of next.gifts ?? []) seen.current.add(gift.id);
      setNote("");
      close();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "没送出去");
    }
  }

  return (
    <>
      <button type="button" onClick={open} className="soft-btn rounded-full bg-rose-deep px-5 py-2 text-sm font-bold text-white">
        靠近一点
      </button>
      <dialog ref={dialogRef} className="sheet w-[min(24rem,calc(100vw-2rem))] bg-transparent p-0 text-ink backdrop:bg-[rgba(74,59,54,0.38)]" aria-labelledby="closer-title">
        <div className="card rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="closer-title" className="text-xl font-extrabold">靠近一点</h2>
              <p className="text-xs text-muted">Come closer{partnerName ? ` · ${partnerName}` : ""}</p>
            </div>
            <button type="button" onClick={close} className="rounded-full px-3 py-1 text-sm text-muted" aria-label="关闭">
              关闭
            </button>
          </div>
          {!partnerName ? <p className="mt-4 text-sm text-muted">等对方走进小屋，就能靠近一点。</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CLOSER_KINDS.filter((item) => item.id !== "note").map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!partnerName}
                onClick={() => send(item.id)}
                className="rounded-2xl bg-blush px-3 py-3 text-left text-sm font-bold text-rose-deep disabled:opacity-50"
              >
                {item.zh}
                <span className="mt-0.5 block text-[10px] font-normal text-muted">{item.en}</span>
              </button>
            ))}
          </div>
          <form onSubmit={(event) => send("note", event)} className="mt-3 flex gap-2">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={80}
              placeholder="留句话…"
              aria-label="留句话"
              className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-card px-4 py-2 text-sm outline-none"
            />
            <button type="submit" disabled={!partnerName || !note.trim()} className="rounded-full bg-rose px-4 text-sm font-bold text-white disabled:opacity-50">
              送出
            </button>
          </form>
          {localError ? <p className="mt-3 text-sm text-rose-deep">{localError}</p> : null}
        </div>
      </dialog>
      {burst ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center pb-28 md:items-center md:pb-0" aria-live="polite">
          <div className="heart-float rounded-full bg-card px-4 py-2 text-sm font-bold text-rose-deep shadow">
            {burst}
          </div>
        </div>
      ) : null}
    </>
  );
}
