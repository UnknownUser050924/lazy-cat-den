"use client";

import { FormEvent, useState } from "react";
import { Page } from "@/components/Page";
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
    <Page className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">信箱</h1>
        <p className="text-sm text-muted">写给这间小屋的人。还没拆开时先藏着。谁在小屋里，谁都能拆开看，不是只给一个人的私信。</p>
      </header>
      <form onSubmit={send} className="card space-y-3 rounded-[24px] p-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="今天也要好好吃饭哦"
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-cream/40 px-4 py-3 text-ink outline-none placeholder:text-muted"
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
                  拆开
                </button>
              )}
              {letter.openedAt && letter.openedBy ? (
                <p className="mt-2 text-xs text-muted">
                  {letter.openedBy}拆开了 · {formatTime(letter.openedAt)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </Page>
  );
}
