"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Page } from "@/components/Page";
import { LookEditor } from "@/components/LookEditor";
import { ProfileCard } from "@/components/ProfileCard";
import { useRoomContext } from "@/components/RoomShell";
import { CAT_FORMS, FEELINGS, POCKET_KEYS } from "@/lib/constants";
import { feelingOf, momentText } from "@/lib/cottage";
import { readSession } from "@/lib/session";
import type { Room } from "@/lib/types";

const FAVORITES = ["food", "music", "game", "animal"] as const;

type Saver = () => Promise<boolean>;

export default function CornerPage() {
  const { room, roomId, displayName, act, error, refresh, busy } = useRoomContext();
  const [who, setWho] = useState(displayName);
  const [lookOpen, setLookOpen] = useState(false);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("who")?.trim();
    if (wanted) setWho(wanted);
  }, []);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const savers = useRef(new Set<Saver>());

  const register = useCallback((fn: Saver) => {
    savers.current.add(fn);
    return () => {
      savers.current.delete(fn);
    };
  }, []);

  const flushAll = useCallback(async () => {
    const results = await Promise.all([...savers.current].map((fn) => fn()));
    return results.every(Boolean);
  }, []);

  useEffect(() => {
    if (editing) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [editing]);

  async function finish() {
    setClosing(true);
    const ok = await flushAll();
    setClosing(false);
    if (ok) setEditing(false);
  }

  if (!room) return <p className="text-center text-muted">推开角落的门…</p>;

  const people = [...room.members, ...(room.away ?? [])];
  const member = people.find((item) => item.displayName === who) ?? people.find((item) => item.displayName === displayName);
  if (!member) return <p className="text-sm text-muted">先进入小屋。</p>;
  const mine = member.displayName === displayName;
  const form = CAT_FORMS.find((item) => item.id === member.profile.formId) ?? CAT_FORMS[0];
  const feeling = feelingOf(member.statusId);
  const thought = momentText(member);

  return (
    <Page className="space-y-5">
      <header className="text-center">
        <p className="text-xs tracking-[0.2em] text-rose">CORNER</p>
        <h1 className="mt-1 text-3xl font-extrabold">{member.displayName}</h1>
        <p className="text-sm text-muted">{form.zh} · {form.line}</p>
      </header>

      {people.length > 1 ? (
        <div className="flex justify-center gap-2">
          {people.map((item) => (
            <button
              key={item.displayName}
              type="button"
              onClick={() => setWho(item.displayName)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${who === item.displayName ? "bg-rose text-white" : "bg-blush text-rose-deep"}`}
            >
              {item.displayName}
            </button>
          ))}
        </div>
      ) : null}

      <section className="card space-y-3 rounded-[28px] px-5 py-5 text-center">
        <p className="text-sm text-rose-deep">{feeling ? feeling.zh : "还没说感觉"}</p>
        <p className="text-lg">{member.profile.signature || "还没写签名"}</p>
        <p className="text-sm leading-relaxed text-muted">{thought ? `此刻 · ${thought}` : "此刻还是空的"}</p>
      </section>

      {!lookOpen ? <ProfileCard roomId={roomId} member={member} selfName={displayName} compact /> : null}

      {mine ? (
        lookOpen ? (
          <LookEditor
            roomId={roomId}
            member={member}
            selfName={displayName}
            busy={busy}
            onCancel={() => setLookOpen(false)}
            onSave={async (draft) => {
              await act({ type: "setLook", ...draft });
              setLookOpen(false);
            }}
            onUpload={async (file) => {
              const body = new FormData();
              body.set("file", file);
              const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/avatar`, {
                method: "POST",
                body,
                credentials: "include",
              });
              const data = (await res.json()) as Room & { error?: string };
              if (!res.ok) throw new Error(data.error || "没存上");
              await refresh();
            }}
            onClearPhoto={async () => {
              await act({ type: "clearAvatar" });
            }}
          />
        ) : (
          <button type="button" onClick={() => setLookOpen(true)} className="soft-btn w-full rounded-full bg-rose-deep py-3 font-bold text-white">
            编辑我的资料
          </button>
        )
      ) : null}

      <section>
        <h2 className="mb-2 font-bold">喜欢的</h2>
        <div className="grid grid-cols-2 gap-2">
          {FAVORITES.map((key) => {
            const label = POCKET_KEYS.find((item) => item.id === key);
            const value = member.profile.pocket?.[key]?.trim();
            return (
              <div key={key} className="rounded-2xl bg-blush/60 px-3 py-3">
                <p className="text-xs text-muted">{label?.zh}</p>
                <p className="font-bold">{value || "还没写"}</p>
              </div>
            );
          })}
        </div>
      </section>

      {mine ? (
        <HouseKey />
      ) : null}

      {mine ? (
        <button type="button" onClick={() => setEditing(true)} className="soft-btn w-full rounded-full bg-rose-deep py-3 font-bold text-white">
          编辑角落
        </button>
      ) : (
        <p className="text-center text-xs text-muted">这是 {member.displayName} 的角落，只能看。</p>
      )}
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      {mine ? (
        <dialog
          ref={dialogRef}
          className="sheet text-ink"
          onCancel={(event) => {
            event.preventDefault();
            void finish();
          }}
          aria-labelledby="edit-corner"
        >
          <div className="card max-h-[min(80dvh,calc(100dvh-2rem))] space-y-4 overflow-y-auto rounded-[28px] p-5">
            <div className="flex items-center justify-between">
              <h2 id="edit-corner" className="text-xl font-extrabold">编辑角落</h2>
              <button type="button" disabled={closing} onClick={() => void finish()} className="text-sm text-muted disabled:opacity-60">
                {closing ? "保存中…" : "完成"}
              </button>
            </div>
            <fieldset>
              <legend className="text-sm font-bold">现在的样子</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CAT_FORMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => act({ type: "setForm", formId: item.id })}
                    className={`rounded-full px-3 py-1 text-sm ${member.profile.formId === item.id ? "bg-rose text-white" : "bg-blush text-rose-deep"}`}
                  >
                    {item.zh}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold">现在的感觉</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FEELINGS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => act({ type: "setStatus", statusId: item.id })}
                    className={`rounded-full px-3 py-1 text-sm ${member.statusId === item.id ? "bg-rose text-white" : "bg-blush text-rose-deep"}`}
                  >
                    {item.zh}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-bold">
              签名
              <SavedField
                key={`${member.displayName}-signature`}
                saved={member.profile.signature}
                placeholder="写一句签名"
                register={register}
                onSave={(value) => act({ type: "setSignature", signature: value })}
              />
            </label>
            <label className="block text-sm font-bold">
              此刻
              <SavedField
                key={`${member.displayName}-moment`}
                saved={member.profile.thinking}
                placeholder="现在只想抱一下…"
                register={register}
                onSave={(value) =>
                  act({
                    type: "setThoughts",
                    thinking: value,
                    need: member.profile.need,
                    want: member.profile.want,
                  })
                }
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-bold">喜欢的</p>
              {FAVORITES.map((key) => (
                <label key={key} className="block text-xs text-muted">
                  {POCKET_KEYS.find((item) => item.id === key)?.zh}
                  <SavedField
                    key={`${member.displayName}-${key}`}
                    saved={member.profile.pocket?.[key] ?? ""}
                    register={register}
                    onSave={(value) => act({ type: "setPocket", key, value })}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">写完会自己保存。关掉前会再存一遍。</p>
          </div>
        </dialog>
      ) : null}
    </Page>
  );
}

function HouseKey() {
  const claim = readSession()?.claim ?? "";
  const [copied, setCopied] = useState(false);
  if (!claim) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-card px-4 py-3 text-sm text-muted">
        这台设备还没拿到钥匙。先在小屋里待一会儿，再回来看。
      </section>
    );
  }
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-card px-4 py-3">
      <p className="text-sm font-bold text-ink">小屋钥匙</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        换手机或清掉记录时，把这串钥匙带走。别人只知道房间名和你的名字，进不了这个位子。不要发给外人。
      </p>
      <code className="mt-2 block break-all rounded-2xl bg-blush/50 px-3 py-2 text-xs text-ink">{claim}</code>
      <button
        type="button"
        className="mt-2 text-xs font-bold text-rose-deep"
        onClick={async () => {
          await navigator.clipboard.writeText(claim);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? "已复制" : "复制钥匙"}
      </button>
    </section>
  );
}

function SavedField({
  saved,
  placeholder,
  onSave,
  register,
}: {
  saved: string;
  placeholder?: string;
  onSave: (value: string) => Promise<unknown>;
  register: (fn: Saver) => () => void;
}) {
  const [value, setValue] = useState(saved);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const focused = useRef(false);
  const valueRef = useRef(value);
  const savedRef = useRef(saved);
  const saveRef = useRef(onSave);
  const statusRef = useRef(status);
  const seq = useRef(0);
  const pending = useRef(false);
  valueRef.current = value;
  savedRef.current = saved;
  saveRef.current = onSave;
  statusRef.current = status;

  const flush = useCallback(async () => {
    const next = valueRef.current;
    if (next.trim() === savedRef.current.trim() && statusRef.current !== "error") return true;
    const mine = ++seq.current;
    pending.current = true;
    setStatus("saving");
    try {
      await saveRef.current(next);
      if (seq.current !== mine) return false;
      pending.current = false;
      setStatus("saved");
      return true;
    } catch {
      if (seq.current === mine) {
        pending.current = true;
        setStatus("error");
      }
      return false;
    }
  }, []);

  useEffect(() => register(flush), [flush, register]);

  useEffect(() => {
    if (focused.current || pending.current) return;
    setValue(saved);
  }, [saved]);

  useEffect(() => {
    if (value.trim() === saved.trim()) return;
    const timer = setTimeout(() => {
      void flush();
    }, 700);
    return () => clearTimeout(timer);
  }, [flush, saved, value]);

  useEffect(() => {
    function onHide() {
      if (valueRef.current.trim() !== savedRef.current.trim()) void flush();
    }
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  return (
    <div>
      <input
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          setValue(event.target.value);
          if (status === "saved" || status === "idle") setStatus("idle");
        }}
        onBlur={() => {
          focused.current = false;
          void flush();
        }}
        className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2 font-normal text-ink placeholder:text-muted"
      />
      <p className="mt-1 text-xs font-normal" aria-live="polite">
        {status === "saving" ? <span className="text-muted">保存中…</span> : null}
        {status === "saved" ? <span className="text-rose-deep">已保存</span> : null}
        {status === "error" ? (
          <button type="button" className="font-bold text-rose-deep" onClick={() => void flush()}>
            没存上，再试一次
          </button>
        ) : null}
      </p>
    </div>
  );
}
