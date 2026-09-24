"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@/components/RoomShell";
import { CLOSER_KINDS } from "@/lib/constants";
import { closerReceivedLine, closerSentLine } from "@/lib/cottage";

export function ComeCloser({
  people,
  prefer,
  openToken = 0,
}: {
  people: string[];
  prefer?: string;
  openToken?: number;
}) {
  const { room, displayName, act } = useRoomContext();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [note, setNote] = useState("");
  const [to, setTo] = useState(prefer && people.includes(prefer) ? prefer : people[0] ?? "");
  const [localError, setLocalError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const partnerName = people.includes(to) ? to : people[0] ?? "";

  useEffect(() => {
    setTo((cur) => {
      if (prefer && people.includes(prefer)) return prefer;
      if (people.includes(cur)) return cur;
      return people[0] ?? "";
    });
  }, [people, prefer]);

  useEffect(() => {
    if (!openToken) return;
    dialogRef.current?.showModal();
  }, [openToken]);

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
    setNotice(closerReceivedLine(incoming.kind, incoming.from, incoming.note));
  }, [displayName, room]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function open() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setLocalError("");
    setSending(false);
    setConfirm("");
    dialogRef.current?.showModal();
  }

  const inFlight = sending && !confirm;

  function close() {
    if (inFlight) return;
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setSending(false);
    setConfirm("");
    dialogRef.current?.close();
  }

  async function send(kind: string, event?: FormEvent) {
    event?.preventDefault();
    if (sending) return;
    if (!partnerName) {
      setLocalError("等有人走进小屋");
      return;
    }
    setLocalError("");
    setSending(true);
    try {
      const next = await act({
        type: "gift",
        target: partnerName,
        kind,
        note: kind === "note" ? note : undefined,
      });
      for (const gift of next.gifts ?? []) seen.current.add(gift.id);
      const line = closerSentLine(kind, partnerName, kind === "note" ? note : undefined);
      const extra = kind === "note" ? `。这句话不会贴到墙上，${partnerName}打开「靠近一点」就能看到` : "";
      setConfirm(`${line} ♡${extra}`);
      if (kind === "note") setNote("");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion) {
        closeTimer.current = setTimeout(() => {
          setSending(false);
          setConfirm("");
          dialogRef.current?.close();
          closeTimer.current = null;
        }, 1600);
      }
    } catch (err) {
      setSending(false);
      setLocalError(err instanceof Error ? err.message : "没送出去");
    }
  }

  const mine = (room?.gifts ?? []).filter((gift) => gift.to === displayName).slice(0, 6);

  return (
    <>
      <button type="button" onClick={open} className="soft-btn rounded-full bg-rose-deep px-5 py-2 text-sm font-bold text-white">
        靠近一点
      </button>
      {notice ? (
        <p className="max-w-xs text-sm text-rose-deep" aria-live="polite">
          {notice} ♡
        </p>
      ) : null}
      <dialog
        ref={dialogRef}
        className="sheet text-ink"
        aria-labelledby="closer-title"
        aria-busy={inFlight}
        onCancel={(event) => {
          if (inFlight) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !inFlight) close();
        }}
        onClose={() => {
          setSending(false);
          setConfirm("");
        }}
      >
        <div className="card max-h-[min(80dvh,36rem)] space-y-4 overflow-y-auto rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="closer-title" className="text-xl font-extrabold">靠近一点</h2>
              <p className="text-xs text-muted">{partnerName ? `给 ${partnerName}` : "Come closer"}</p>
            </div>
            <button type="button" onClick={close} disabled={inFlight} className="rounded-full px-3 py-1 text-sm text-muted disabled:opacity-50" aria-label="关闭">
              关闭
            </button>
          </div>
          {confirm ? (
            <p className="rounded-2xl bg-blush/70 px-4 py-3 text-sm font-bold text-rose-deep" role="status">
              {confirm}
            </p>
          ) : null}
          {!people.length ? <p className="text-sm text-muted">等有人走进小屋，就能靠近一点。</p> : null}
          {people.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {people.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={sending}
                  onClick={() => setTo(name)}
                  className={`rounded-full px-3 py-1 text-sm font-bold disabled:opacity-50 ${partnerName === name ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {CLOSER_KINDS.filter((item) => item.id !== "note").map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!partnerName || sending}
                onClick={() => send(item.id)}
                className="rounded-2xl bg-blush px-3 py-3 text-left text-sm font-bold text-rose-deep disabled:opacity-50"
              >
                {item.zh}
                <span className="mt-0.5 block text-[10px] font-normal text-muted">{item.en}</span>
              </button>
            ))}
          </div>
          <form onSubmit={(event) => send("note", event)} className="flex gap-2">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={80}
              placeholder="留句话…"
              aria-label="留句话"
              disabled={sending}
              className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-card px-4 py-2 text-sm outline-none disabled:opacity-50"
            />
            <button type="submit" disabled={!partnerName || !note.trim() || sending} className="rounded-full bg-rose px-4 text-sm font-bold text-white disabled:opacity-50">
              {sending ? "送出中" : "送出"}
            </button>
          </form>
          {localError ? <p className="text-sm text-rose-deep">{localError}</p> : null}
          {mine.length ? (
            <div>
              <p className="text-xs font-bold text-muted">别人给你的</p>
              <ul className="mt-2 space-y-1 text-sm">
                {mine.map((gift) => (
                  <li key={gift.id}>{closerReceivedLine(gift.kind, gift.from, gift.note)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted">留的话不会贴到墙上。对方打开「靠近一点」就能看到。</p>
          )}
        </div>
      </dialog>
    </>
  );
}
