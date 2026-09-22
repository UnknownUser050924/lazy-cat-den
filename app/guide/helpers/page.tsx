import { readFileSync } from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visitor notes · 懒猫小屋",
  robots: { index: false, follow: false },
};

export default function HelperGuidePage() {
  const guide = readFileSync(path.join(process.cwd(), "GUIDE.md"), "utf8");

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      <article className="card whitespace-pre-wrap rounded-[28px] p-6 text-sm leading-7">{guide}</article>
    </main>
  );
}
