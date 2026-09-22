"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CatMascot, moodLabel } from "@/components/CatMascot";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function CottagePage() {
  const { room, roomId, displayName, act, error } = useRoomContext();
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  if (!room) {
    return <p className="text-center text-muted">铺着垫子… warming the cushions…</p>;
  }

  const label = moodLabel(room.cat.mood);

  async function copyInvite() {
    const url = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    await act({ type: "addNote", text: note });
    setNote("");
  }

  return (
    <div className="space-y-5">
      <section className="card rounded-[28px] px-5 pb-5 pt-3 text-center">
        <CatMascot mood={room.cat.mood} onPat={() => act({ type: "pat" })} />
        <h1 className="text-2xl font-extrabold">欢迎回家 Welcome home</h1>
        <p className="mt-1 text-sm text-muted">
          猫现在 {label.zh} · {label.en}
        </p>
        <div className="mx-auto mt-3 h-2.5 w-48 overflow-hidden rounded-full bg-blush">
          <div
            className="h-full rounded-full bg-rose transition-all"
            style={{ width: `${room.cat.mood}%` }}
          />
        </div>
      </section>

      <section className="card rounded-[24px] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">谁在小屋 Who is here</h2>
          <button onClick={copyInvite} className="text-xs font-bold text-rose">
            {copied ? "已复制 Copied" : "邀请链接 Invite"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {room.members.length === 0 ? (
            <p className="text-sm text-muted">还很安静 still quiet</p>
          ) : (
            room.members.map((member) => (
              <span
                key={member.displayName}
                className={`rounded-full px-3 py-1 text-sm ${
                  member.displayName === displayName
                    ? "bg-rose text-white"
                    : "bg-blush text-rose-deep"
                }`}
              >
                {member.displayName}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          { href: "qa", zh: "问答", en: "Ask & answer", emoji: "💌" },
          { href: "draw", zh: "抽签", en: "Draw lots", emoji: "🎀" },
          { href: "wishlist", zh: "愿望", en: "Wishlist", emoji: "🌙" },
          { href: "cat", zh: "猫", en: "Pat the cat", emoji: "🐱" },
        ].map((item) => (
          <Link
            key={item.href}
            href={`/room/${encodeURIComponent(room.id)}/${item.href}`}
            className="card soft-btn rounded-[22px] p-4"
          >
            <div className="text-xl">{item.emoji}</div>
            <div className="mt-2 font-bold">{item.zh}</div>
            <div className="text-xs text-muted">{item.en}</div>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">便签 Sticky notes</h2>
        <form onSubmit={addNote} className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="写一句给对方… a little note"
            className="flex-1 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 outline-none focus:border-rose"
          />
          <button className="rounded-2xl bg-rose-deep px-4 font-bold text-white">贴 Pin</button>
        </form>
        {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          {room.notes.map((item) => (
            <article
              key={item.id}
              className="pop-in rounded-2xl p-3 shadow-sm"
              style={{ background: item.color }}
            >
              <p className="text-sm leading-relaxed">{item.text}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink/70">
                <span>
                  {item.author} · {formatTime(item.createdAt)}
                </span>
                <button onClick={() => act({ type: "removeNote", noteId: item.id })}>✕</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
