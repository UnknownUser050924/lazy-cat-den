import { readFileSync } from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guide · 懒猫小屋",
  description: "How to visit Lazy Cat Den, written for people and for assistants.",
};

export default function GuidePage() {
  const guide = readFileSync(path.join(process.cwd(), "GUIDE.md"), "utf8");

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      <article className="card whitespace-pre-wrap rounded-[28px] p-6 text-sm leading-7">
        {guide}
      </article>
    </main>
  );
}
