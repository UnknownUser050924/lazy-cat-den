"use client";

import { FormEvent, useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function LetterPage() {
  const { room, displayName, act, error } = useRoomContext();
  const [text, setText] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  if (!room) return <p className="text-center text-muted">信封还没拆…</p>;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    await act({ type: "sendLetter", text });
    setText("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">给你的信</h1>
        <p className="text-sm text-muted">拆开前先藏着。小屋里谁拆开谁看。</p>
      </header>
      <form onSubmit={send} className="card space-y-3 rounded-[24px] p-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="今天也要好好吃饭哦"
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-cream/40 px-4 py-3 outline-none"
        />
        <button className="w-full rounded-full bg-rose-deep py-3 font-bold text-white">留下信</button>
      </form>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <div className="space-y-3">
        {room.letters.length === 0 ? <p className="text-sm text-muted">还没有信。</p> : null}
        {room.letters.map((letter) => {
          const mine = letter.from === displayName;
          const opened = openId === letter.id || Boolean(letter.openedAt && letter.openedBy === displayName);
          return (
            <article key={letter.id} className="card rounded-[24px] p-4">
              <p className="text-sm font-bold">{letter.from}留了一张纸条</p>
              <p className="text-xs text-muted">{formatTime(letter.createdAt)}</p>
              {mine || opened || letter.openedBy === displayName ? (
                <p className="mt-3 text-sm">{letter.text}</p>
              ) : (
                <button
                  className="mt-3 rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep"
                  onClick={async () => {
                    await act({ type: "openLetter", letterId: letter.id });
                    setOpenId(letter.id);
                  }}
                >
                  Open
                </button>
              )}
              {letter.openedAt && letter.openedBy ? (
                <p className="mt-2 text-xs text-muted">
                  Opened by {letter.openedBy} · {formatTime(letter.openedAt)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
