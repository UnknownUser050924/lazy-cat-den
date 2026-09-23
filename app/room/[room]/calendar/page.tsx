"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRoomContext } from "@/components/RoomShell";
import { EVENT_TYPES } from "@/lib/constants";
import { dateKey } from "@/lib/time";

export default function CalendarPage() {
  const { room, act, error } = useRoomContext();
  const [cursor, setCursor] = useState(() => {
    const [year, month, day] = dateKey().split("-").map(Number);
    return new Date(year, month - 1, day);
  });
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => dateKey());
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0].id);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    return { start, days };
  }, [month, year]);

  if (!room) return <p className="text-center text-muted">翻开日历…</p>;

  const marks = new Map<string, string>();
  for (const event of room.events) {
    if (!marks.has(event.date)) {
      marks.set(event.date, EVENT_TYPES.find((item) => item.id === event.eventType)?.mark ?? "·");
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    await act({ type: "addEvent", date, eventType, title });
    setTitle("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="flex items-center justify-between">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-sm text-rose">
          上一月
        </button>
        <h1 className="text-xl font-extrabold">
          {year} / {month + 1}
        </h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-sm text-rose">
          下一月
        </button>
      </header>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: cells.start }).map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {Array.from({ length: cells.days }).map((_, index) => {
          const day = index + 1;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const today = key === dateKey();
          return (
            <button
              key={key}
              onClick={() => setDate(key)}
              className={`rounded-xl py-2 text-sm ${date === key ? "bg-rose text-white" : today ? "bg-blush text-rose-deep" : "bg-card"}`}
            >
              <div>{day}</div>
              <div className="text-[10px] text-rose-deep">{marks.get(key) ?? ""}</div>
            </button>
          );
        })}
      </div>
      <form onSubmit={add} className="card space-y-3 rounded-[24px] p-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="这一天要做什么"
          className="w-full rounded-2xl border border-[var(--line)] bg-cream/40 px-4 py-3 outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setEventType(item.id)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                eventType === item.id ? "bg-rose text-white" : "bg-blush text-rose-deep"
              }`}
            >
              {item.zh}
            </button>
          ))}
        </div>
        <button className="w-full rounded-full bg-rose-deep py-3 font-bold text-white">记下 {date}</button>
      </form>
      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      <div className="space-y-2">
        {room.events
          .filter((item) => item.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
          .map((item) => (
            <article key={item.id} className="card flex items-center justify-between rounded-2xl px-4 py-3">
              <div>
                <p className="font-bold">
                  {EVENT_TYPES.find((type) => type.id === item.eventType)?.mark} {item.title}
                </p>
                <p className="text-xs text-muted">
                  {item.date} · {item.addedBy}
                </p>
              </div>
              <button onClick={() => act({ type: "removeEvent", eventId: item.id })} className="text-xs text-muted">
                删除
              </button>
            </article>
          ))}
      </div>
    </div>
  );
}
