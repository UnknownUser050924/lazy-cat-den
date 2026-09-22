"use client";

import { FormEvent, useState } from "react";
import { formatTime, useRoomContext } from "@/components/RoomShell";

export default function QAPage() {
  const { room, displayName, act, busy, error } = useRoomContext();
  const [question, setQuestion] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!room) return <p className="text-center text-muted">翻开纸页…</p>;

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    await act({ type: "ask", question });
    setQuestion("");
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">问答 Q&A</h1>
        <p className="text-sm text-muted">问一件小事，留给对方慢慢答</p>
      </header>
      <form onSubmit={ask} className="card space-y-3 rounded-[24px] p-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="今天想问什么？ What do you want to ask?"
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-cream/50 px-4 py-3 outline-none focus:border-rose"
        />
        <button
          disabled={busy}
          className="soft-btn w-full rounded-full bg-rose-deep py-3 font-bold text-white disabled:opacity-60"
        >
          提问 Ask
        </button>
      </form>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <div className="space-y-3">
        {room.questions.length === 0 ? (
          <p className="text-sm text-muted">还没有问题。Ask the first one.</p>
        ) : (
          room.questions.map((item) => (
            <article key={item.id} className="card rounded-[24px] p-4">
              <p className="text-xs text-muted">
                {item.askedBy} · {formatTime(item.createdAt)}
              </p>
              <p className="mt-1 text-lg font-bold">{item.question}</p>
              {item.answer ? (
                <p className="mt-3 rounded-2xl bg-blush/70 px-3 py-3 text-sm">
                  <span className="font-bold">{item.answeredBy}：</span>
                  {item.answer}
                </p>
              ) : (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const answer = drafts[item.id]?.trim();
                    if (!answer) return;
                    await act({ type: "answer", questionId: item.id, answer });
                    setDrafts((prev) => ({ ...prev, [item.id]: "" }));
                  }}
                >
                  <input
                    value={drafts[item.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder={
                      item.askedBy === displayName
                        ? "留给对方答 Leave this for them"
                        : "写下答案 Write an answer"
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-cream/50 px-4 py-2 outline-none focus:border-rose"
                  />
                  <button className="text-sm font-bold text-rose">回答 Answer</button>
                </form>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
