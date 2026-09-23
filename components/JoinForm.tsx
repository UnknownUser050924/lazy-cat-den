"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CatMascot } from "@/components/CatMascot";
import { DEFAULT_ROOM, slugifyRoom } from "@/lib/constants";
import { readSession, writeSession } from "@/lib/session";

export function JoinForm({
  initialRoom = "",
  invited = false,
  joined = "",
}: {
  initialRoom?: string;
  invited?: boolean;
  joined?: string;
}) {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom || DEFAULT_ROOM);
  const [fromInvite, setFromInvite] = useState(invited);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
      setName("");
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
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "join", displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      writeSession({ room: roomId, displayName });
      router.push(`/room/${encodeURIComponent(roomId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.28em] text-rose">LAZY CAT DEN</p>
        <h1 className="mt-2 text-4xl font-extrabold">懒猫小屋</h1>
        <p className="mt-2 text-sm text-muted">同一间小屋 · 谁进来都能待在一起</p>
        <p className="mt-2 text-xs">
          <a className="font-bold text-rose" href="/guide">
            怎么玩
          </a>
        </p>
      </div>
      <div className="mt-2">
        <CatMascot pose="idle" size={210} />
      </div>
      {joined ? (
        <p className="mt-4 text-center text-sm font-bold text-rose-deep">{joined} 已经在小屋里</p>
      ) : null}
      <form action="/api/join" method="post" onSubmit={onSubmit} className="card mt-2 space-y-4 rounded-[28px] p-5">
        <label className="block">
          <span className="text-xs font-bold text-muted">房间名 Room</span>
          <input
            name="room"
            value={room}
            readOnly={fromInvite}
            onChange={(e) => setRoom(e.target.value)}
            placeholder={DEFAULT_ROOM}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-cream/60 px-4 py-3 outline-none focus:border-rose read-only:opacity-80"
          />
        </label>
        {fromInvite ? (
          <p className="text-xs text-muted">你被邀请进这个房间。请写下你自己的名字。</p>
        ) : (
          <button type="button" onClick={() => setRoom(DEFAULT_ROOM)} className="text-xs text-rose">
            用建议名 use {DEFAULT_ROOM}
          </button>
        )}
        <label className="block">
          <span className="text-xs font-bold text-muted">你的名字 Your name</span>
          <input
            name="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={fromInvite ? "写下你自己的名字" : "嘉怡 或 宝宝"}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-cream/60 px-4 py-3 outline-none focus:border-rose"
          />
        </label>
        {fromInvite ? null : (
          <div className="flex gap-2">
            {["嘉怡", "宝宝"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setName(item)}
                className={`soft-btn flex-1 rounded-full px-3 py-2 text-sm font-bold ${
                  name === item ? "bg-rose text-white" : "bg-blush text-rose-deep"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
        <p className="text-xs leading-relaxed text-muted">
          名字对上就会接着用这个人已经写过的角落和记录。想当新的人，就换一个名字。小屋里没有密码，知道房间名的人都能进。
        </p>
        <button
          disabled={busy}
          className="soft-btn w-full rounded-full bg-rose-deep py-3 text-base font-bold text-white disabled:opacity-60"
        >
          {busy ? "推开门中…" : "进入小屋 Enter"}
        </button>
      </form>
    </div>
  );
}
