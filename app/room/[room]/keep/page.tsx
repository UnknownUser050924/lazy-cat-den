"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoomContext } from "@/components/RoomShell";
import { emptyProfile } from "@/lib/profile";
import type { ClientAction, Member } from "@/lib/types";

type KeepAction = Extract<
  ClientAction,
  { type: "clearSeat" | "restoreSeat" | "banPerson" | "unbanPerson" | "wipeCorner" | "erasePerson" }
>["type"];

export default function KeepPage() {
  const { room, roomId, displayName, admin, act, error, busy } = useRoomContext();
  const [pending, setPending] = useState("");
  const [working, setWorking] = useState("");

  if (!admin) {
    return <p className="text-center text-muted">这页只有管理人能用。</p>;
  }
  if (!room) return <p className="text-center text-muted">翻开看管…</p>;

  const bannedNames = room.banned ?? [];
  const seated = room.members.filter((item) => item.displayName !== displayName);
  const away = room.away ?? [];
  const kicked = away.filter((item) => !bannedNames.includes(item.displayName));
  const bannedPeople = bannedNames.map((name) => {
    const member = away.find((item) => item.displayName === name);
    return (
      member ?? {
        displayName: name,
        lastSeen: 0,
        statusId: null,
        visitDays: [],
        profile: emptyProfile(),
      }
    );
  });

  async function run(type: KeepAction, target: string) {
    const key = `${type}:${target}`;
    if (pending !== key) {
      setPending(key);
      return;
    }
    setWorking(key);
    try {
      await act({ type, target });
      setPending("");
    } finally {
      setWorking("");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">看管</h1>
        <p className="text-sm text-muted">请出、不让进、删掉，只有你看得到。邀请进来的人没有这些按钮。</p>
      </header>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="font-bold">不让进</h2>
        {bannedPeople.length === 0 ? <p className="text-sm text-muted">现在没有人被拦住。</p> : null}
        {bannedPeople.map((member) => (
          <PersonCard
            key={member.displayName}
            member={member}
            roomId={roomId}
            kind="banned"
            pending={pending}
            working={working}
            busy={busy}
            onRun={run}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">请出的人</h2>
        {kicked.length === 0 ? <p className="text-sm text-muted">现在没有人被请出。</p> : null}
        {kicked.map((member) => (
          <PersonCard
            key={member.displayName}
            member={member}
            roomId={roomId}
            kind="kicked"
            pending={pending}
            working={working}
            busy={busy}
            onRun={run}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">还在小屋里</h2>
        {seated.length === 0 ? <p className="text-sm text-muted">除了你，没有别人坐着。</p> : null}
        {seated.map((member) => (
          <PersonCard
            key={member.displayName}
            member={member}
            roomId={roomId}
            kind="seated"
            pending={pending}
            working={working}
            busy={busy}
            onRun={run}
          />
        ))}
      </section>
    </div>
  );
}

function PersonCard({
  member,
  roomId,
  kind,
  pending,
  working,
  busy,
  onRun,
}: {
  member: Member;
  roomId: string;
  kind: "seated" | "kicked" | "banned";
  pending: string;
  working: string;
  busy: boolean;
  onRun: (type: KeepAction, target: string) => void;
}) {
  const name = member.displayName;
  const note =
    kind === "banned"
      ? "这个名字进不了小屋，直到你解开"
      : kind === "kicked"
        ? "别人看不见这个位子。他们还能用同一个名字走进来"
        : "现在坐在小屋里";
  return (
    <article className="card rounded-[24px] px-4 py-4">
      <p className="text-lg font-extrabold">{name}</p>
      <p className="text-xs text-muted">{note}</p>
      <p className="mt-2 text-sm">{member.profile.signature || "还没写签名"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {kind !== "banned" || member.lastSeen ? (
          <Link
            href={`/room/${encodeURIComponent(roomId)}/corner?who=${encodeURIComponent(name)}`}
            className="shrink-0 rounded-full bg-blush px-3 py-1 text-xs font-bold text-rose-deep"
          >
            看角落
          </Link>
        ) : null}
        {kind === "seated" ? (
          <ActionButton
            label="请出"
            confirm="确定请出？"
            pending={pending === `clearSeat:${name}`}
            working={working === `clearSeat:${name}`}
            disabled={busy}
            onClick={() => onRun("clearSeat", name)}
          />
        ) : null}
        {kind === "kicked" ? (
          <ActionButton
            label="让位子回来"
            confirm="确定放回来？"
            pending={pending === `restoreSeat:${name}`}
            working={working === `restoreSeat:${name}`}
            disabled={busy}
            onClick={() => onRun("restoreSeat", name)}
          />
        ) : null}
        {kind === "banned" ? (
          <ActionButton
            label="解开"
            confirm="确定解开？"
            pending={pending === `unbanPerson:${name}`}
            working={working === `unbanPerson:${name}`}
            disabled={busy}
            onClick={() => onRun("unbanPerson", name)}
          />
        ) : (
          <ActionButton
            label="不让进"
            confirm="确定不让进？"
            pending={pending === `banPerson:${name}`}
            working={working === `banPerson:${name}`}
            disabled={busy}
            onClick={() => onRun("banPerson", name)}
          />
        )}
        {kind !== "banned" || member.lastSeen ? (
          <ActionButton
            label="清空角落"
            confirm="确定清空角落？"
            pending={pending === `wipeCorner:${name}`}
            working={working === `wipeCorner:${name}`}
            disabled={busy}
            onClick={() => onRun("wipeCorner", name)}
          />
        ) : null}
        <ActionButton
          label="删掉全部"
          confirm="确定删掉全部？"
          pending={pending === `erasePerson:${name}`}
          working={working === `erasePerson:${name}`}
          disabled={busy}
          danger
          onClick={() => onRun("erasePerson", name)}
        />
      </div>
      {pending.endsWith(`:${name}`) ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{HINT[pending.split(":")[0] as KeepAction]}</p>
      ) : null}
    </article>
  );
}

function ActionButton({
  label,
  confirm,
  pending,
  working,
  disabled,
  danger = false,
  onClick,
}: {
  label: string;
  confirm: string;
  pending: boolean;
  working: boolean;
  disabled: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || working}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${
        danger ? "bg-rose-deep text-white" : "border border-[var(--line)] bg-card text-ink"
      }`}
    >
      {working ? "正在处理…" : pending ? confirm : label}
    </button>
  );
}

const HINT: Partial<Record<KeepAction, string>> = {
  clearSeat: "先请出小屋。他们还能用同一个名字走进来。",
  restoreSeat: "他们可以再坐进来，角落还是原来的。",
  banPerson: "这个名字进不了小屋，直到你解开。",
  unbanPerson: "解开之后，这个名字可以再走进小屋。",
  wipeCorner: "只清角落。便签、信和故事还在。",
  erasePerson: "角落、便签、信和故事都会没。不能反悔。",
};
