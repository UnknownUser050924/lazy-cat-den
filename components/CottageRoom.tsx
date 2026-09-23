"use client";

import { FormEvent, useState, type ReactNode } from "react";
import type { CatPose } from "@/lib/cottage";
import Link from "next/link";
import { CatMascot, moodLabel } from "@/components/CatMascot";
import { ComeCloser } from "@/components/ComeCloser";
import { formatTime, useRoomContext } from "@/components/RoomShell";
import { CAT_FORMS } from "@/lib/constants";
import { consoleState } from "@/lib/games";
import {
  catPose,
  catSpeech,
  catSpot,
  feelingOf,
  momentText,
  partnerOf,
  presenceLabel,
  roomDecor,
  skyPhase,
  tinyMoments,
  togetherStreak,
} from "@/lib/cottage";
import { clockLabel, dateLabel } from "@/lib/time";
import { useNow } from "@/lib/use-now";
import type { Member } from "@/lib/types";

export function CottageRoom() {
  const { room, roomId, displayName, act, error } = useRoomContext();
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [patted, setPatted] = useState(false);
  const [actPose, setActPose] = useState<CatPose | null>(null);
  const [actLine, setActLine] = useState("");
  const [moment, setMoment] = useState(0);
  const now = useNow();
  const sky = skyPhase(now);

  if (!room) {
    return <p className="text-center text-muted">铺着垫子… warming the cushions…</p>;
  }

  const me = room.members.find((member) => member.displayName === displayName) ?? null;
  const partner = partnerOf(room, displayName);
  const speech = catSpeech(room, sky, displayName, now);
  const spot = catSpot(room, sky, now);
  const decor = roomDecor(room);
  const gameState = consoleState(room, displayName);
  const lines = tinyMoments(room, displayName, now);
  const streak = togetherStreak(room.members, now);
  const base = `/room/${encodeURIComponent(roomId)}`;
  const banner = lines.length ? lines[moment % lines.length] : "";

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

  async function pat() {
    setPatted(true);
    await act({ type: "pat" });
    setTimeout(() => setPatted(false), 700);
  }

  async function play(kind: "playToy" | "feedCat") {
    setActPose(kind === "playToy" ? "playing" : "eating");
    setActLine(kind === "playToy" ? "抓到了！" : "吃饱啦 ♡");
    try {
      await act({ type: kind });
    } catch (err) {
      setActLine(err instanceof Error ? err.message : "等一下");
    }
    setTimeout(() => {
      setActPose(null);
      setActLine("");
    }, 2400);
  }

  return (
    <div className="space-y-4">
      {sky === "night" ? <p className="text-center text-sm text-rose">Good night, {displayName}</p> : null}
      {banner ? (
        <button type="button" onClick={() => setMoment((value) => value + 1)} className="pop-in w-full rounded-full bg-blush/80 px-4 py-2 text-sm text-rose-deep">
          {banner}
        </button>
      ) : null}

      <section className="cottage-scene relative overflow-hidden rounded-[32px] px-3 pb-5 pt-4 md:px-6 xl:min-h-[34rem]">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div className="cottage-window" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
            <span className="cottage-lamp" aria-hidden />
            <time dateTime={new Date(now).toISOString()}>
              {dateLabel(now)} {clockLabel(now)} · {sky === "day" ? "白天" : sky === "evening" ? "傍晚" : "夜里"}
            </time>
            {decor.star ? <span aria-label="连续回来的小星星">✦</span> : null}
          </div>
        </div>

        <div className="mx-auto mt-4 grid max-w-5xl items-end gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.9fr)]">
          <PartnerSpot member={me} selfName={displayName} now={now} emptyLabel="你的位置" self />
          <div className="order-first text-center xl:order-none">
            <div className={`cat-spot-${spot}`}>
              <CatMascot pose={actPose ?? catPose(room, sky, now)} size={200} patted={patted || actPose === "playing"} onPat={pat} />
            </div>
            <p className="text-lg font-extrabold">{actLine || speech.zh}</p>
            <p className="text-xs text-muted">{actLine ? "" : speech.en}</p>
            <p className="mt-1 text-xs text-muted">
              {moodLabel(room.cat.mood).zh}
              {streak > 0 ? ` · 一起 ${streak} 天` : ""}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button type="button" onClick={() => play("playToy")} className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-rose-deep">
                玩具
              </button>
              <button type="button" onClick={() => play("feedCat")} className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-rose-deep">
                喂猫
              </button>
            </div>
            <div className="mt-3">
              <ComeCloser partnerName={partner?.displayName ?? null} />
            </div>
          </div>
          <PartnerSpot member={partner} selfName={displayName} now={now} emptyLabel="还空着一个位置" />
        </div>

        <div className="mx-auto mt-5 flex max-w-5xl flex-wrap justify-center gap-2">
          <RoomObject href={`${base}/letter`} label="信箱 Letter" caption="信箱" icon={<MailIcon sealed={decor.seal} />} />
          <RoomObject href={`${base}/qa`} label="问答纸 Q&A" caption="问答" icon={<PaperIcon />} />
          <RoomObject href={`${base}/draw`} label="抽签罐子 Draw" caption="抽签" icon={<JarIcon />} />
          <RoomObject href={`${base}/wishlist`} label="愿望盒 Wishlist" caption="愿望" icon={<BoxIcon flower={decor.flower} />} />
          <RoomObject href={`${base}/calendar`} label="日历 Calendar" caption="日历" icon={<CalendarIcon />} />
          <RoomObject href={`${base}/today`} label="今日 Today" caption="今日" icon={<SunIcon />} />
          <RoomObject href={`${base}/memories`} label="我们的故事 Memories" caption="故事" icon={<BookIcon />} />
          <RoomObject
            href={`${base}/games`}
            label={gameState === "waiting" ? "有一局等你" : gameState === "active" ? "正在一起玩" : "游戏 Games"}
            caption={gameState === "waiting" ? "等你" : gameState === "active" ? "在玩" : "游戏"}
            icon={<ConsoleIcon waiting={gameState === "waiting"} />}
            className={gameState === "active" ? "room-object-live" : ""}
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">墙上的便签</h2>
          <button type="button" onClick={copyInvite} className="text-xs font-bold text-rose">
            {copied ? "已复制" : "邀请链接"}
          </button>
        </div>
        <form onSubmit={addNote} className="flex gap-2">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="写一句给对方…"
            aria-label="便签"
            className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 text-ink outline-none"
          />
          <button className="rounded-2xl bg-rose-deep px-4 font-bold text-white">贴</button>
        </form>
        {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {room.notes.map((item) => (
            <article key={item.id} className="pop-in rounded-2xl p-3 shadow-sm" style={{ background: item.color, color: "#4a3b36" }}>
              <p className="text-sm leading-relaxed">{item.text}</p>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span>
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
  );
}

function PartnerSpot({
  member,
  selfName,
  now,
  emptyLabel,
  self = false,
}: {
  member: Member | null;
  selfName: string;
  now: number;
  emptyLabel: string;
  self?: boolean;
}) {
  if (!member) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--line)] px-4 py-5 text-center text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }
  const feeling = feelingOf(member.statusId);
  const form = CAT_FORMS.find((item) => item.id === member.profile.formId);
  const thought = momentText(member);
  return (
    <div className={`rounded-[24px] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] px-4 py-4 ${self ? "" : ""}`}>
      <p className="text-[11px] text-muted">{self ? "我" : "对方"}</p>
      <p className="text-lg font-extrabold">{member.displayName}</p>
      <p className="text-xs text-muted">{presenceLabel(member, selfName, now)}</p>
      <p className="mt-2 text-sm">{member.profile.signature || "还没写签名"}</p>
      <p className="mt-1 text-sm text-rose-deep">{feeling ? feeling.zh : "还没说感觉"}</p>
      {form ? <p className="text-xs text-muted">{form.zh}</p> : null}
      {thought ? <p className="mt-2 text-sm leading-relaxed">“{thought}”</p> : null}
    </div>
  );
}

function RoomObject({
  href,
  label,
  caption,
  icon,
  className = "",
}: {
  href: string;
  label: string;
  caption: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`room-object ${className}`} aria-label={label} title={label}>
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

function JarIcon() {
  return (
    <Glyph>
      <rect x="11" y="5" width="10" height="3.5" rx="1.2" fill="#e8b48a" />
      <path d="M10 9.5h12v12.2a6 6 0 0 1-12 0Z" fill="#f7d6d9" stroke="#c36b76" strokeWidth="1.6" />
      <path d="M12.5 15h7" stroke="#fffaf6" strokeWidth="1.4" strokeLinecap="round" />
    </Glyph>
  );
}

function BoxIcon({ flower }: { flower: boolean }) {
  return (
    <Glyph>
      <path d="M16 11c-3-5-8-2-4 1 2-2 4 0 4 0s2-2 4 0c4-3-1-6-4-1Z" fill="#d98993" />
      <rect x="6" y="13" width="20" height="12" rx="2" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" />
      <path d="M6 17.5h20M16 13v12" stroke="#c36b76" strokeWidth="1.4" />
      {flower ? <circle cx="24" cy="10" r="2" fill="#f7d6d9" stroke="#c36b76" /> : null}
    </Glyph>
  );
}

function CalendarIcon() {
  return (
    <Glyph>
      <rect x="6" y="8" width="20" height="17" rx="2.5" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" />
      <path d="M6 14h20" stroke="#c36b76" strokeWidth="1.4" />
      <path d="M11 6v4M21 6v4" stroke="#4a3b36" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.1" fill="#d98993" />
      <circle cx="16" cy="19" r="1.1" fill="#f7d6d9" />
      <circle cx="20" cy="19" r="1.1" fill="#f7d6d9" />
    </Glyph>
  );
}

function SunIcon() {
  return (
    <Glyph>
      <circle cx="16" cy="16" r="5" fill="#f8e1b0" stroke="#d98993" strokeWidth="1.6" />
      <path d="M16 5v3M16 24v3M5 16h3M24 16h3M8.2 8.2l2 2M21.8 21.8l2 2M23.8 8.2l-2 2M10.2 21.8l-2 2" stroke="#d98993" strokeWidth="1.5" strokeLinecap="round" />
    </Glyph>
  );
}

function BookIcon() {
  return (
    <Glyph>
      <path d="M5 8.5c4 0 7 1.6 11 1.6s7-1.6 11-1.6v16c-4 0-7 1.6-11 1.6s-7-1.6-11-1.6Z" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 10.2v15.6" stroke="#d98993" strokeWidth="1.3" />
    </Glyph>
  );
}

function ConsoleIcon({ waiting }: { waiting: boolean }) {
  return (
    <Glyph>
      <rect x="5" y="10" width="22" height="14" rx="4" fill="#fffaf6" stroke="#c36b76" strokeWidth="1.6" />
      <circle cx="11" cy="17" r="2.2" fill="#d98993" />
      <path d="M19 15.2h4M21 13.2v4" stroke="#c36b76" strokeWidth="1.5" strokeLinecap="round" />
      {waiting ? <circle cx="25" cy="9" r="2.3" fill="#d98993" /> : null}
    </Glyph>
  );
}
