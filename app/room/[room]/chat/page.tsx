"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function ChatPage() {
  const { room, displayName, act, busy, error } = useRoomContext();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const count = room?.messages.length ?? 0;
  const latest = room?.messages[0]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count, latest]);

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
    <div className="flex min-h-[70dvh] flex-col">
      <header>
        <h1 className="text-2xl font-extrabold">聊天 Chat</h1>
        <p className="text-sm text-muted">说一句，对方一会儿就能看到</p>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">还没有话。先说一句吧。</p>
        ) : (
          messages.map((item) => {
            const mine = item.author === displayName;
            return (
              <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[22px] px-4 py-2 ${
                    mine ? "bg-rose-deep text-white" : "card"
                  }`}
                >
                  <p className={`text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>
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

      <form onSubmit={send} className="sticky bottom-24 mt-4 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={200}
          placeholder="写一句… say something"
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-card px-4 py-3 outline-none focus:border-rose"
        />
        <button
          disabled={busy || !text.trim()}
          className="soft-btn rounded-full bg-rose-deep px-5 font-bold text-white disabled:opacity-60"
        >
          发送
        </button>
      </form>
    </div>
  );
}
