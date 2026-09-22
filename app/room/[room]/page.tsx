"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CatMascot, moodLabel } from "@/components/CatMascot";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import { COUPLE_STATUSES } from "@/lib/constants";
import { catSpeech, isHere, isNight, togetherStreak } from "@/lib/cottage";

export default function CottagePage() {
  const { room, roomId, displayName, act, error } = useRoomContext();
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const night = isNight();

  if (!room) {
    return <p className="text-center text-muted">铺着垫子… warming the cushions…</p>;
  }

  const label = moodLabel(room.cat.mood);
  const speech = catSpeech(room, night);
  const streak = togetherStreak(room.members);
  const me = room.members.find((member) => member.displayName === displayName);
  const people = room.members;
  const today = new Date().toISOString().slice(0, 10);

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

  const objects = [
    { href: "chat", zh: "聊天", en: "Chat" },
    { href: "letter", zh: "信", en: "Letter" },
    { href: "qa", zh: "问答", en: "Q&A" },
    { href: "draw", zh: "抽签", en: "Draw" },
    { href: "wishlist", zh: "愿望", en: "Wish" },
    { href: "calendar", zh: "日历", en: "Days" },
    { href: "today", zh: "今日", en: "Today" },
  ];

  return (
    <div className="space-y-5">
      {night ? (
        <p className="text-center text-sm text-rose">Good night, {displayName}</p>
      ) : null}

      <section className="card relative overflow-hidden rounded-[28px] px-4 pb-4 pt-4">
        <div className="stars pointer-events-none absolute inset-x-6 top-3 text-center text-xs tracking-[0.6em] text-rose">
          ✦ ✦ ✦
        </div>
        <p className="text-center text-sm font-bold">小屋今天也有人来啦</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {people.map((member) => {
            const status = COUPLE_STATUSES.find((item) => item.id === member.statusId);
            const here = member.displayName === displayName || isHere(member);
            const label = here
              ? "在线"
              : member.visitDays.includes(today)
                ? "刚刚还在"
                : "离开中";
            return (
              <div key={member.displayName}>
                <p className="font-extrabold">{member.displayName}</p>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 max-w-36 text-sm">{member.profile.signature || "还没写签名"}</p>
                <p className="mt-1 text-sm text-rose-deep">{status ? status.zh : "还没说状态"}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Together today: {streak} days</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {COUPLE_STATUSES.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => act({ type: "setStatus", statusId: status.id })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                me?.statusId === status.id ? "bg-rose text-white" : "bg-blush text-rose-deep"
              }`}
            >
              {status.zh}
            </button>
          ))}
        </div>
      </section>

      <section className="card relative overflow-hidden rounded-[28px] px-4 pb-5 pt-6 text-center">
        <CatMascot mood={room.cat.mood} size={180} sleeping={night} onPat={() => act({ type: "pat" })} />
        <p className="text-lg font-extrabold">{speech.zh}</p>
        <p className="text-xs text-muted">{speech.en}</p>
        <p className="mt-1 text-xs text-muted">
          {label.zh} · {room.cat.mood}/100
        </p>
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-2">
          {objects.map((item) => (
            <Link
              key={item.href}
              href={`/room/${encodeURIComponent(room.id)}/${item.href}`}
              className="rounded-2xl bg-blush/70 px-2 py-3 text-rose-deep"
            >
              <div className="text-sm font-bold">{item.zh}</div>
              <div className="text-[10px]">{item.en}</div>
            </Link>
          ))}
        </div>
        <button onClick={copyInvite} className="mt-3 text-xs font-bold text-rose">
          {copied ? "已复制 Copied" : "邀请链接 Invite"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">墙上的便签</h2>
        <form onSubmit={addNote} className="flex gap-2">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="写一句给对方… a little note"
            className="flex-1 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 outline-none focus:border-rose"
          />
          <button className="rounded-2xl bg-rose-deep px-4 font-bold text-white">贴</button>
        </form>
        {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          {room.notes.map((item) => (
            <article key={item.id} className="pop-in rounded-2xl p-3 shadow-sm" style={{ background: item.color, color: "#4a3b36" }}>
              <p className="text-sm leading-relaxed">{item.text}</p>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span>
                  {item.author} · {formatTime(item.createdAt)}
                </span>
                <button onClick={() => act({ type: "removeNote", noteId: item.id })}>✕</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link href={`/room/${encodeURIComponent(room.id)}/memories`} className="block text-center text-sm font-bold text-rose">
        我们的小故事 Memories
      </Link>
    </div>
  );
}
