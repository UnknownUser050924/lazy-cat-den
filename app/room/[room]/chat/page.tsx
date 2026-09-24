"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Page } from "@/components/Page";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function ChatPage() {
  const { room, displayName, act, busy, error } = useRoomContext();
  const [text, setText] = useState("");
  const [heart, setHeart] = useState(false);
  const seen = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const count = room?.messages.length ?? 0;
  const latest = room?.messages[0]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count, latest]);

  useEffect(() => {
    const newest = room?.messages[0];
    if (!newest) return;
    if (seen.current && seen.current !== newest.id && newest.author !== displayName) {
      setHeart(true);
      const timer = setTimeout(() => setHeart(false), 1600);
      seen.current = newest.id;
      return () => clearTimeout(timer);
    }
    seen.current = newest.id;
  }, [displayName, room?.messages]);

  if (!room) return <p className="text-center text-muted">铺开垫子…</p>;

  const messages = [...room.messages].reverse();

  async function send(event: FormEvent) {
    event.preventDefault();
    const next = text.trim();
    if (!next) return;
    setText("");
    await act({ type: "sendChat", text: next });
  }

  return (
    <Page width="chat" className="flex min-h-[calc(100dvh-7.5rem)] w-full flex-col">
      <header>
        <h1 className="text-2xl font-extrabold">聊天</h1>
        <p className="text-sm text-muted">留在小屋里的话</p>
      </header>
      {heart ? <p className="heart-float mt-2 text-sm text-rose-deep" aria-live="polite">♡ {room?.messages[0]?.author}留了一句</p> : null}

      <div className="mt-4 flex flex-1 flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">还没有话。先说一句吧。</p>
        ) : (
          messages.map((item) => {
            const mine = item.author === displayName;
            return (
              <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`chat-bubble max-w-[min(80%,28rem)] rounded-[22px] px-4 py-2 ${
                    mine ? "bg-blush text-ink" : "bg-card text-ink shadow-sm"
                  }`}
                >
                  <p className="text-[11px] text-muted">
                    {item.author} · {formatTime(item.createdAt)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{item.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}

      <form onSubmit={send} className="composer sticky bottom-0 z-[1] -mx-1 mt-4 flex gap-2 bg-[color-mix(in_srgb,var(--cream)_94%,transparent)] py-3 backdrop-blur-md">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={200}
          placeholder="写一句… say something"
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-card px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-rose"
        />
        <button
          disabled={busy || !text.trim()}
          className="soft-btn rounded-full bg-rose-deep px-5 font-bold text-white disabled:opacity-60"
        >
          发送
        </button>
      </form>
    </Page>
  );
}
