import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "怎么玩 · 懒猫小屋",
  description: "A short guide to Lazy Cat Den.",
};

const STEPS = [
  { zh: "写下房间名", en: "Type the room name", detail: "yiyi-and-you" },
  { zh: "选你的名字", en: "Pick your name", detail: "嘉怡 或 宝宝" },
  { zh: "进小屋", en: "Open the cottage", detail: "看看对方在不在" },
];

const PLAY = [
  ["聊天", "Say something"],
  ["问答", "Ask one small question"],
  ["抽签", "Let the den choose"],
  ["愿望", "Add something you want"],
  ["猫", "Pat the cat"],
  ["信", "Leave one note"],
];

export default function GuidePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-center text-xs font-bold tracking-[0.28em] text-rose">LAZY CAT DEN</p>
      <h1 className="mt-2 text-center text-4xl font-extrabold">怎么玩</h1>
      <p className="mt-2 text-center text-sm text-muted">三步就够了 · three steps</p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.zh} className="card flex items-center gap-4 rounded-[24px] px-4 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush font-extrabold text-rose-deep">
              {index + 1}
            </span>
            <span>
              <span className="block font-bold">{step.zh}</span>
              <span className="block text-xs text-muted">
                {step.en} · {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PLAY.map(([zh, en]) => (
          <span key={zh} className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-rose-deep">
            {zh}
            <span className="font-normal text-muted"> {en}</span>
          </span>
        ))}
      </div>

      <Link
        href="/"
        className="soft-btn mt-8 block rounded-full bg-rose-deep py-3 text-center font-bold text-white"
      >
        进入小屋 Enter
      </Link>
    </main>
  );
}
