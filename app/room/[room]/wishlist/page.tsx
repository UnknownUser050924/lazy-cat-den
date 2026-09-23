"use client";

import { FormEvent, useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function WishlistPage() {
  const { room, act, busy, error } = useRoomContext();
  const [text, setText] = useState("");

  if (!room) return <p className="text-center text-muted">折星星…</p>;

  const open = room.wishlist.filter((item) => !item.done);
  const done = room.wishlist.filter((item) => item.done);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    await act({ type: "addWish", text });
    setText("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">愿望 Wishlist</h1>
        <p className="text-sm text-muted">想一起做的、想吃的、想看的</p>
      </header>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="加一条愿望 Add a wish"
          className="flex-1 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 outline-none focus:border-rose"
        />
        <button
          disabled={busy}
          className="rounded-2xl bg-rose-deep px-4 font-bold text-white disabled:opacity-60"
        >
          添加
        </button>
      </form>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <section className="space-y-2">
        {open.map((item) => (
          <article key={item.id} className="card flex items-start gap-3 rounded-2xl p-4">
            <button
              onClick={() => act({ type: "toggleWish", wishId: item.id })}
              className="mt-1 h-5 w-5 rounded-full border-2 border-rose"
              aria-label="Mark done"
            />
            <div className="flex-1">
              <p className="font-bold">{item.text}</p>
              <p className="text-xs text-muted">
                {item.addedBy} · {formatTime(item.createdAt)}
              </p>
            </div>
            <button
              onClick={() => act({ type: "removeWish", wishId: item.id })}
              className="text-xs text-muted"
            >
              删除
            </button>
          </article>
        ))}
        {open.length === 0 ? (
          <p className="text-sm text-muted">愿望单还空着。The list is empty.</p>
        ) : null}
      </section>
      {done.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-bold text-muted">已经实现 Done</h2>
          {done.map((item) => (
            <article key={item.id} className="flex items-start gap-3 rounded-2xl bg-card/70 p-4 opacity-70">
              <button
                onClick={() => act({ type: "toggleWish", wishId: item.id })}
                className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[10px] text-white"
                aria-label="Mark open"
              >
                ✓
              </button>
              <p className="flex-1 line-through">{item.text}</p>
              <button
                onClick={() => act({ type: "removeWish", wishId: item.id })}
                className="text-xs text-muted"
              >
                删除
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
