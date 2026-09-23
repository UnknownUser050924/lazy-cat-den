"use client";

import { FormEvent, useState } from "react";
import { Page } from "@/components/Page";
import { useRoomContext } from "@/components/RoomShell";
import { DAILY_PROMPTS } from "@/lib/constants";
import { promptForDate } from "@/lib/cottage";
import { dateKey, dateLabel } from "@/lib/time";
import { useNow } from "@/lib/use-now";

export default function TodayPage() {
  const { room, displayName, act, error } = useRoomContext();
  const [text, setText] = useState("");
  const now = useNow();
  if (!room) return <p className="text-center text-muted">翻开今日问题…</p>;

  const date = dateKey(now);
  const prompt = DAILY_PROMPTS.find((item) => item.id === promptForDate(date).id) ?? promptForDate(date);
  const day = room.daily.find((item) => item.date === date);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    await act({ type: "answerDaily", text });
    setText("");
  }

  return (
    <Page className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">今日问题</h1>
        <p className="text-sm text-muted">{dateLabel(now)} · {date}</p>
      </header>
      <section className="card rounded-[24px] p-4">
        <p className="text-lg font-bold">{prompt.zh}</p>
        <p className="mt-1 text-sm text-muted">{prompt.en}</p>
      </section>
      <form onSubmit={submit} className="space-y-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`${displayName} 的回答`}
          className="w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
        <button className="w-full rounded-full bg-rose-deep py-3 font-bold text-white">回答</button>
      </form>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <div className="space-y-2">
        {(day?.answers ?? []).map((answer) => (
          <article key={answer.name} className="card rounded-2xl p-4">
            <p className="text-xs text-muted">{answer.name}</p>
            <p className="font-bold">{answer.text}</p>
          </article>
        ))}
        {(day?.answers.length ?? 0) >= 2 ? <p className="text-center text-sm text-rose">Both answered</p> : null}
      </div>
    </Page>
  );
}
