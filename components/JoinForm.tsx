"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CatMascot } from "@/components/CatMascot";
import { DEFAULT_ROOM, slugifyRoom } from "@/lib/constants";
import { readClaim, readSession, writeSession } from "@/lib/session";

export function JoinForm({
  initialRoom = "",
  invited = false,
  joined = "",
  initialError = "",
}: {
  initialRoom?: string;
  invited?: boolean;
  joined?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom || DEFAULT_ROOM);
  const [fromInvite, setFromInvite] = useState(invited);
  const [name, setName] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(Boolean(initialError));

  useEffect(() => {
    document.documentElement.removeAttribute("data-sky");
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room")?.trim() ?? "";
    const existing = readSession();
    if (roomFromUrl) {
      const id = slugifyRoom(roomFromUrl);
      setRoom(id);
      setFromInvite(true);
      if (existing?.room === id && existing.displayName) {
        router.replace(`/room/${encodeURIComponent(id)}`);
        return;
      }
      setName(existing?.displayName ?? "");
      return;
    }
    if (existing?.room) setRoom(existing.room);
    if (existing?.displayName) setName(existing.displayName);
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const roomId = slugifyRoom(room);
    const displayName = name.trim().slice(0, 24);
    if (!roomId) {
      setError("给小屋起个名字吧 Give the room a name");
      return;
    }
    if (!displayName) {
      setError("先写你的名字 Write your name first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const savedClaim = readClaim(roomId, displayName) || key.trim() || undefined;
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "join", displayName, claim: savedClaim }),
      });
      const data = (await res.json()) as { error?: string; claim?: string };
      if (!res.ok) throw new Error(data.error || "Could not join");
      const headerClaim = res.headers.get("X-LCD-Claim") ?? data.claim ?? savedClaim;
      writeSession({ room: roomId, displayName, claim: headerClaim });
      router.push(`/room/${encodeURIComponent(roomId)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not join";
      setError(message);
      if (message.includes("钥匙") || message.includes("已经有人")) setShowKey(true);
      setBusy(false);
    }
  }

  return (
    <div className="join-screen relative min-h-dvh overflow-x-hidden">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,26.5rem)] lg:gap-10 lg:px-10 lg:py-6">
        <section className="join-welcome flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-xs font-bold tracking-[0.28em] text-rose-deep">LAZY CAT DEN</p>
          <h1 className="mt-2 text-[2.15rem] font-extrabold leading-tight text-ink sm:text-4xl">懒猫小屋</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">同一间小屋 · 谁进来都能待在一起</p>
          <p className="mt-2 text-sm">
            <a className="font-bold text-rose-deep" href="/guide">
              怎么玩
            </a>
          </p>
          <div className="mt-3 lg:mt-5">
            <CatMascot pose="idle" size={176} />
          </div>
          {joined ? <p className="mt-3 text-sm font-bold text-rose-deep">{joined} 已经在小屋里</p> : null}
        </section>

        <section className="min-w-0">
          <form
            action="/api/join"
            method="post"
            onSubmit={onSubmit}
            className="card space-y-3 rounded-[28px] p-5 sm:p-6"
          >
            <p className="text-base font-extrabold text-ink">走进小屋</p>
            <label className="block">
              <span className="text-sm font-bold text-ink">房间名 Room</span>
              <input
                name="room"
                value={room}
                readOnly={fromInvite}
                onChange={(e) => setRoom(e.target.value)}
                placeholder={DEFAULT_ROOM}
                className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-cream/60 px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-rose read-only:opacity-80"
              />
            </label>
            {fromInvite ? (
              <p className="text-sm text-muted">你被邀请进这个房间。请写下你自己的名字。</p>
            ) : (
              <button type="button" onClick={() => setRoom(DEFAULT_ROOM)} className="text-sm font-bold text-rose-deep">
                用建议名 use {DEFAULT_ROOM}
              </button>
            )}
            <label className="block">
              <span className="text-sm font-bold text-ink">你的名字 Your name</span>
              <input
                name="displayName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fromInvite ? "写下你自己的名字" : "嘉怡 或 宝宝"}
                className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-cream/60 px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-rose"
              />
            </label>
            {fromInvite ? null : (
              <div className="flex gap-2">
                {["嘉怡", "宝宝", "无名"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setName(item)}
                    className={`soft-btn min-h-10 flex-1 rounded-full px-3 py-2 text-sm font-bold ${
                      name === item ? "bg-rose-deep text-white" : "bg-blush text-rose-deep"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            {showKey ? (
              <label className="block">
                <span className="text-sm font-bold text-ink">小屋钥匙</span>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="换手机时，把角落里那串钥匙贴进来"
                  autoComplete="off"
                  className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-cream/60 px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-rose"
                />
              </label>
            ) : (
              <button type="button" onClick={() => setShowKey(true)} className="text-sm font-bold text-rose-deep">
                换了手机？用钥匙走进来
              </button>
            )}
            {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
            <p className="text-sm leading-relaxed text-muted">
              这台手机进过小屋之后，会认领这个名字，并在「我的角落」留下一把钥匙。换手机或清掉记录时，把那把钥匙带过来，别人光知道房间名和名字进不来。没有钥匙就请换一个新名字，不要猜别人的名字。
            </p>
            <button
              disabled={busy}
              className="soft-btn w-full rounded-full bg-rose-deep py-3 text-base font-bold text-white disabled:opacity-60"
            >
              {busy ? "推开门中…" : "进入小屋 Enter"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
