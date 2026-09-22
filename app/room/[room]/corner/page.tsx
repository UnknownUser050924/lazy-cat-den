"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@/components/RoomShell";
import {
  CAT_FORMS,
  CORNER_OBJECTS,
  GIFT_KINDS,
  KNOW_PROMPTS,
  GENDERS,
  POCKET_KEYS,
  VIBES,
  WALLS,
} from "@/lib/constants";
import type { Member } from "@/lib/types";

const WALL_TINT: Record<string, string> = {
  flower: "#f7d6d9",
  night: "#3a3148",
  cozy: "#f8e1b0",
  garden: "#d4e5c5",
  bedroom: "#f5c6ce",
  gaming: "#d5e3f0",
};

export default function CornerPage() {
  const { room, displayName, act, error, setError } = useRoomContext();
  const [who, setWho] = useState(displayName);
  const [guesses, setGuesses] = useState<Record<string, string>>({});

  if (!room) return <p className="text-center text-muted">推开角落的门…</p>;

  const member = room.members.find((item) => item.displayName === who) ?? room.members.find((item) => item.displayName === displayName);
  if (!member) return <p className="text-sm text-muted">先进入小屋。</p>;
  const mine = member.displayName === displayName;
  const form = CAT_FORMS.find((item) => item.id === member.profile.formId) ?? CAT_FORMS[0];
  const understood = understoodPercent(member, room.members, displayName);

  return (
    <div className="space-y-5">
      <header className="text-center">
        <p className="text-xs tracking-[0.2em] text-rose">MY LITTLE CORNER</p>
        <h1 className="text-3xl font-extrabold">{member.displayName}</h1>
        <p className="text-sm text-rose-deep">
          {GENDERS.find((item) => item.id === member.profile.gender)?.zh ?? "还没选性别"}
        </p>
        <p className="text-sm text-muted">
          {form.zh} · {form.line}
        </p>
        {member.profile.signature ? <p className="mt-2 text-lg">{member.profile.signature}</p> : <p className="mt-2 text-sm text-muted">还没写签名</p>}
      </header>

      <div className="flex justify-center gap-2">
        {room.members.map((item) => (
          <button
            key={item.displayName}
            onClick={() => setWho(item.displayName)}
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              who === item.displayName ? "bg-rose text-white" : "bg-blush text-rose-deep"
            }`}
          >
            {item.displayName}
          </button>
        ))}
      </div>

      <section className="rounded-[24px] p-4" style={{ background: WALL_TINT[member.profile.wall] ?? "#f8e1b0", color: "#4a3b36" }}>
        <p className="text-xs font-bold">{WALLS.find((item) => item.id === member.profile.wall)?.zh}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {member.profile.objects.length === 0 ? <p className="text-sm">角落还空着</p> : null}
          {member.profile.objects.map((id) => (
            <span key={id} className="rounded-full bg-white/70 px-3 py-1 text-sm">
              {CORNER_OBJECTS.find((item) => item.id === id)?.zh ?? id}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold">我的感觉</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {VIBES.map((vibe) => {
            const on = member.profile.vibes.includes(vibe.id);
            return (
              <button
                key={vibe.id}
                disabled={!mine}
                onClick={() => {
                  const next = on
                    ? member.profile.vibes.filter((id) => id !== vibe.id)
                    : [...member.profile.vibes, vibe.id].slice(0, 5);
                  act({ type: "setVibes", vibes: next });
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold ${on ? "bg-rose text-white" : "bg-blush text-rose-deep"}`}
              >
                {vibe.zh}
              </button>
            );
          })}
        </div>
      </section>

      {mine ? (
        <section className="space-y-2">
          <h2 className="font-bold">我现在是哪种猫</h2>
          <div className="flex flex-wrap gap-2">
            {CAT_FORMS.map((item) => (
              <button
                key={item.id}
                onClick={() => act({ type: "setForm", formId: item.id })}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  member.profile.formId === item.id ? "bg-rose text-white" : "bg-card"
                }`}
              >
                {item.zh}
              </button>
            ))}
          </div>
          <Thoughts member={member} onSave={(thinking, need, want) => act({ type: "setThoughts", thinking, need, want })} />
          <div>
            <p className="text-sm">性别 Gender</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => act({ type: "setGender", gender: item.id })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    member.profile.gender === item.id ? "bg-rose text-white" : "bg-blush text-rose-deep"
                  }`}
                >
                  {item.zh}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="card space-y-2 rounded-[24px] p-4 text-sm">
          <p>签名 {member.profile.signature || "还没写"}</p>
          <p>在想 {member.profile.thinking || "…"}</p>
          <p>需要 {member.profile.need || "…"}</p>
          <p>想要 {member.profile.want || "…"}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-bold">签名</h2>
        {mine ? (
          <SavedField
            key={`${member.displayName}-signature`}
            saved={member.profile.signature}
            placeholder="写一句签名"
            onSave={(value) => act({ type: "setSignature", signature: value })}
          />
        ) : (
          <p className="card rounded-2xl px-4 py-3">{member.profile.signature || "还没写"}</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">我的口袋</h2>
        {POCKET_KEYS.map((key) => (
          <label key={`${member.displayName}-${key.id}`} className="block text-sm">
            {key.zh}
            <SavedField
              saved={member.profile.pocket[key.id] ?? ""}
              readOnly={!mine}
              placeholder={mine ? key.en : "还没写"}
              onSave={(value) => act({ type: "setPocket", key: key.id, value })}
            />
          </label>
        ))}
      </section>

      {mine ? (
        <section className="space-y-2">
          <h2 className="font-bold">角落布置</h2>
          <div className="flex flex-wrap gap-2">
            {WALLS.map((wall) => (
              <button
                key={wall.id}
                onClick={() => act({ type: "setCorner", wall: wall.id, objects: member.profile.objects })}
                className={`rounded-full px-3 py-1 text-xs ${member.profile.wall === wall.id ? "bg-rose text-white" : "bg-blush"}`}
              >
                {wall.zh}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CORNER_OBJECTS.map((object) => {
              const on = member.profile.objects.includes(object.id);
              return (
                <button
                  key={object.id}
                  onClick={() => {
                    const objects = on
                      ? member.profile.objects.filter((id) => id !== object.id)
                      : [...member.profile.objects, object.id].slice(0, 6);
                    act({ type: "setCorner", wall: member.profile.wall, objects });
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${on ? "bg-rose text-white" : "bg-card"}`}
                >
                  {object.zh}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-bold">Know Me? · {understood}%</h2>
        {KNOW_PROMPTS.map((prompt) => {
          const secret = member.profile.knowMe.find((item) => item.promptId === prompt.id);
          const mineGuess = room.members
            .find((item) => item.displayName === displayName)
            ?.profile.guesses.find((item) => item.target === member.displayName && item.promptId === prompt.id);
          return (
            <div key={`${member.displayName}-${prompt.id}`} className="card rounded-2xl p-3">
              <p className="text-sm font-bold">{prompt.zh}</p>
              {mine ? (
                <SavedField
                  saved={secret?.answer ?? ""}
                  placeholder="只有你先写答案"
                  onSave={(value) => {
                    if (value.trim()) act({ type: "setKnowMe", promptId: prompt.id, answer: value });
                  }}
                />
              ) : secret?.answer ? (
                <form
                  className="mt-2 space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const guess = guesses[prompt.id]?.trim();
                    if (!guess) return;
                    setError(null);
                    const next = await act({
                      type: "guessKnowMe",
                      target: member.displayName,
                      promptId: prompt.id,
                      guess,
                    });
                    const me = next.members.find((item) => item.displayName === displayName);
                    const result = me?.profile.guesses.find(
                      (item) => item.target === member.displayName && item.promptId === prompt.id,
                    );
                    setGuesses((prev) => ({ ...prev, [prompt.id]: "" }));
                    setError(result?.correct ? "你猜中了" : "还没猜中");
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      value={guesses[prompt.id] ?? ""}
                      onChange={(event) => setGuesses((prev) => ({ ...prev, [prompt.id]: event.target.value }))}
                      placeholder="猜一猜"
                      className="flex-1 rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                    />
                    <button className="text-sm font-bold text-rose">猜</button>
                  </div>
                  {mineGuess ? (
                    <p className={`text-xs font-bold ${mineGuess.correct ? "text-rose-deep" : "text-muted"}`}>
                      {mineGuess.correct ? "猜中了" : "还没猜中"}
                    </p>
                  ) : null}
                </form>
              ) : (
                <p className="mt-2 text-sm text-muted">还没写这个答案</p>
              )}
            </div>
          );
        })}
      </section>

      {!mine ? (
        <section>
          <h2 className="mb-2 font-bold">留给 {member.displayName}</h2>
          <div className="flex flex-wrap gap-2">
            {GIFT_KINDS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => act({ type: "gift", target: member.displayName, kind: gift.id })}
                className="rounded-full bg-blush px-3 py-2 text-sm font-bold text-rose-deep"
              >
                {gift.zh}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted">
            {room.gifts
              .filter((gift) => gift.to === member.displayName)
              .slice(0, 5)
              .map((gift) => (
                <p key={gift.id}>
                  {gift.from} {GIFT_KINDS.find((item) => item.id === gift.kind)?.zh}
                </p>
              ))}
          </div>
        </section>
      ) : null}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
    </div>
  );
}

function SavedField({
  saved,
  readOnly = false,
  placeholder,
  onSave,
}: {
  saved: string;
  readOnly?: boolean;
  placeholder?: string;
  onSave?: (value: string) => void;
}) {
  const [value, setValue] = useState(saved);
  const focused = useRef(false);
  const valueRef = useRef(value);
  const savedRef = useRef(saved);
  const saveRef = useRef(onSave);
  valueRef.current = value;
  savedRef.current = saved;
  saveRef.current = onSave;

  useEffect(() => {
    if (!focused.current) setValue(saved);
  }, [saved]);

  useEffect(() => {
    if (readOnly) return;
    if (value.trim() === saved.trim()) return;
    const timer = setTimeout(() => saveRef.current?.(value), 700);
    return () => clearTimeout(timer);
  }, [readOnly, saved, value]);

  useEffect(() => {
    return () => {
      if (valueRef.current.trim() !== savedRef.current.trim()) {
        saveRef.current?.(valueRef.current);
      }
    };
  }, []);

  return (
    <input
      value={readOnly ? saved : value}
      readOnly={readOnly}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        focused.current = false;
        if (!readOnly && value.trim() !== saved.trim()) saveRef.current?.(value);
      }}
      className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2"
    />
  );
}

function understoodPercent(member: Member, members: Member[], viewer: string) {
  if (member.profile.knowMe.length === 0) return 0;
  const other = members.find((item) => item.displayName !== member.displayName) ?? members.find((item) => item.displayName === viewer);
  if (!other || other.displayName === member.displayName) return 0;
  const correct = other.profile.guesses.filter((guess) => guess.target === member.displayName && guess.correct).length;
  return Math.round((correct / member.profile.knowMe.length) * 100);
}

function Thoughts({
  member,
  onSave,
}: {
  member: Member;
  onSave: (thinking: string, need: string, want: string) => void;
}) {
  const [thinking, setThinking] = useState(member.profile.thinking);
  const [need, setNeed] = useState(member.profile.need);
  const [want, setWant] = useState(member.profile.want);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const draft = useRef({ thinking, need, want });
  draft.current = { thinking, need, want };

  useEffect(() => {
    const same =
      thinking === member.profile.thinking &&
      need === member.profile.need &&
      want === member.profile.want;
    if (same) return;
    const timer = setTimeout(() => saveRef.current(thinking, need, want), 700);
    return () => clearTimeout(timer);
  }, [member.profile.need, member.profile.thinking, member.profile.want, need, thinking, want]);

  useEffect(() => {
    return () => {
      const current = draft.current;
      saveRef.current(current.thinking, current.need, current.want);
    };
  }, []);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(thinking, need, want);
      }}
    >
      <input value={thinking} onChange={(event) => setThinking(event.target.value)} placeholder="我在想…" className="w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2" />
      <input value={need} onChange={(event) => setNeed(event.target.value)} placeholder="我需要…" className="w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2" />
      <input value={want} onChange={(event) => setWant(event.target.value)} placeholder="我想要…" className="w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2" />
      <p className="text-xs text-muted">写完会自己保存</p>
    </form>
  );
}
