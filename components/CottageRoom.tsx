"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComeCloser } from "@/components/ComeCloser";
import { CottageScene } from "@/components/CottageScene";
import { Page } from "@/components/Page";
import { ProfileCard } from "@/components/ProfileCard";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import { activityHref, publicActivity } from "@/lib/activity";
import { arrangeSeats, cottageHeadline, peopleLine, roomDecor, skyLabel, skyPhase, tinyMoments, togetherStreak } from "@/lib/cottage";
import { clockLabel, dateLabel } from "@/lib/time";
import { useNow } from "@/lib/use-now";

export function CottageRoom() {
  const { room, roomId, displayName, act, error } = useRoomContext();
  const router = useRouter();
  const cardRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [moment, setMoment] = useState(0);
  const [openName, setOpenName] = useState<string | null>(null);
  const [closer, setCloser] = useState({ token: 0, name: "" });
  const now = useNow();
  const sky = skyPhase(now);

  useEffect(() => {
    if (openName) cardRef.current?.showModal();
    else cardRef.current?.close();
  }, [openName]);

  if (!room) {
    return <p className="text-center text-muted">铺着垫子… warming the cushions…</p>;
  }

  const me = room.members.find((member) => member.displayName === displayName) ?? null;
  const others = room.members.filter((member) => member.displayName !== displayName);
  const decor = roomDecor(room);
  const lines = tinyMoments(room, displayName, now);
  const streak = togetherStreak(room.members, now);
  const base = `/room/${encodeURIComponent(roomId)}`;
  const banner = lines.length ? lines[moment % lines.length] : "";
  const whoLine = peopleLine(room.members, displayName, now);
  const headline = cottageHeadline(room.members, streak, now);
  const feed = publicActivity(room, 4);
  const { seated, overflow } = arrangeSeats(room.members, displayName, now);
  const openMember = openName
    ? room.members.find((member) => member.displayName === openName) ?? null
    : null;
  const firstVisit =
    (me?.visitDays?.length ?? 1) <= 1 &&
    !room.notes.some((item) => item.author === displayName) &&
    !room.questions.some((item) => item.askedBy === displayName) &&
    !room.messages.some((item) => item.author === displayName);

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
    <Page width="wide" className="space-y-5">
      {sky === "night" ? <p className="text-center text-sm font-bold text-rose-deep">Good night, {displayName}</p> : null}
      {banner ? (
        <button type="button" onClick={() => setMoment((value) => value + 1)} className="pop-in w-full rounded-full bg-blush/80 px-4 py-2 text-sm font-bold text-rose-deep">
          {banner}
        </button>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold">懒猫小屋</p>
            <p className="text-sm text-muted">{headline}</p>
          </div>
          <p className="text-[11px] text-muted">
            <time dateTime={new Date(now).toISOString()}>
              {dateLabel(now)} {clockLabel(now)} · {skyLabel(sky)}
            </time>
            {decor.star ? <span aria-label="连续回来的小星星"> ✦</span> : null}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{whoLine}</p>
        <CottageScene
          roomId={roomId}
          selfName={displayName}
          seated={seated}
          overflow={overflow}
          now={now}
          onOpen={setOpenName}
        />
        <div className="flex flex-wrap items-center gap-3">
          <ComeCloser people={others.map((member) => member.displayName)} prefer={closer.name} openToken={closer.token} />
          <p className="text-xs text-muted">
            猫在{" "}
            <Link href={`${base}/cat`} className="font-bold text-rose-deep">
              猫
            </Link>{" "}
            那一页
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RoomObject href={`${base}/letter`} label="信箱" caption="信箱" icon={<MailIcon sealed={decor.seal} />} />
          <RoomObject href={`${base}/games`} label="游戏" caption="游戏" icon={<ConsoleIcon />} />
          <RoomObject href={`${base}/qa`} label="问答纸" caption="问答" icon={<PaperIcon />} />
          <RoomObject href={`${base}/chat`} label="聊天" caption="聊天" icon={<ChatIcon />} />
        </div>
      </section>

      {openMember ? (
        <dialog
          ref={cardRef}
          className="sheet text-ink"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenName(null);
          }}
          onClose={() => setOpenName(null)}
        >
          <div className="space-y-3">
            <div className="flex justify-end">
              <button type="button" className="text-sm text-muted" onClick={() => setOpenName(null)}>
                关闭
              </button>
            </div>
            <ProfileCard
              roomId={roomId}
              member={openMember}
              selfName={displayName}
              mine={openMember.displayName === displayName}
              onEdit={
                openMember.displayName === displayName
                  ? () => {
                      router.push(`${base}/corner`);
                    }
                  : undefined
              }
              onCloser={
                openMember.displayName === displayName
                  ? undefined
                  : () => {
                      setOpenName(null);
                      setCloser((cur) => ({ token: cur.token + 1, name: openMember.displayName }));
                    }
              }
            />
          </div>
        </dialog>
      ) : null}

      {firstVisit ? (
        <section>
          <p className="text-sm font-bold">先做一件小事</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="#notes" className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
              留一句话
            </a>
            <Link href={`${base}/qa`} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
              问或答
            </Link>
            <Link href={`${base}/games`} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep">
              一起玩
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 @min-[48rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]">
        {feed.length ? (
          <section>
            <h2 className="font-bold">最近发生的</h2>
            <ul className="mt-2 space-y-1">
              {feed.map((item) => {
                const href = activityHref(roomId, item);
                const inner = (
                  <>
                    <span>{item.titleZh}</span>
                    <span className="shrink-0 text-[11px] text-muted">{formatTime(item.createdAt)}</span>
                  </>
                );
                return (
                  <li key={item.id}>
                    {href ? (
                      <Link href={href} className="flex items-center justify-between gap-3 rounded-2xl px-1 py-1 text-sm hover:bg-blush/40">
                        {inner}
                      </Link>
                    ) : (
                      <p className="flex items-center justify-between gap-3 rounded-2xl px-1 py-1 text-sm">{inner}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section id="notes" className="scroll-mt-20 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">墙上的便签</h2>
            <button type="button" onClick={copyInvite} className="text-xs font-bold text-rose-deep">
              {copied ? "已复制" : "邀请链接"}
            </button>
          </div>
          <form onSubmit={addNote} className="flex gap-2">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="写一句贴在墙上…"
              aria-label="便签"
              className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 text-ink outline-none placeholder:text-muted"
            />
            <button className="rounded-2xl bg-rose-deep px-4 font-bold text-white">贴</button>
          </form>
          {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3 @min-[40rem]:grid-cols-3">
            {room.notes.map((item) => (
              <article key={item.id} className="pop-in min-w-0 rounded-2xl p-3 shadow-sm" style={{ background: item.color, color: "#4a3b36" }}>
                <p className="text-sm leading-relaxed break-words">{item.text}</p>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate">
                    {item.author} · {formatTime(item.createdAt)}
                  </span>
                  <button type="button" onClick={() => act({ type: "removeNote", noteId: item.id })} aria-label="拿下这张便签">
                    ✕
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}

function RoomObject({
  href,
  label,
  caption,
  icon,
}: {
  href: string;
  label: string;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="room-object" aria-label={label} title={label}>
      {icon}
      <span className="text-[10px] font-bold text-muted">{caption}</span>
    </Link>
  );
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" fill="none">
      {children}
    </svg>
  );
}

function MailIcon({ sealed }: { sealed: boolean }) {
  return (
    <Glyph>
      <rect x="4" y="9" width="24" height="16" rx="2.5" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" />
      <path d="M5 11.5 16 19l11-7.5" stroke="#c36b76" strokeWidth="1.6" strokeLinejoin="round" />
      {sealed ? <circle cx="24" cy="22" r="2.2" fill="#d98993" /> : null}
    </Glyph>
  );
}

function PaperIcon() {
  return (
    <Glyph>
      <rect x="9" y="7" width="14" height="18" rx="2" fill="#fff6d8" stroke="#d98993" strokeWidth="1.6" />
      <circle cx="16" cy="6.5" r="2" fill="#c36b76" />
      <path d="M12.5 13h7M12.5 17h7M12.5 21h4.5" stroke="#8a736c" strokeWidth="1.4" strokeLinecap="round" />
    </Glyph>
  );
}

function ChatIcon() {
  return (
    <Glyph>
      <path d="M6 8h20v12H12l-6 4V8Z" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 14h10M11 17.5h6" stroke="#8a736c" strokeWidth="1.4" strokeLinecap="round" />
    </Glyph>
  );
}

function ConsoleIcon() {
  return (
    <Glyph>
      <rect x="5" y="10" width="22" height="14" rx="4" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" />
      <circle cx="11" cy="17" r="2.2" fill="#d98993" />
      <path d="M19 15.2h4M21 13.2v4" stroke="#c36b76" strokeWidth="1.5" strokeLinecap="round" />
    </Glyph>
  );
}
