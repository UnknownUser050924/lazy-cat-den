"use client";

type Mood = "happy" | "lazy" | "sad";

function moodFromScore(score: number): Mood {
  if (score >= 70) return "happy";
  if (score >= 40) return "lazy";
  return "sad";
}

export function moodLabel(score: number) {
  if (score >= 85) return { zh: "被爱包围", en: "Loved silly" };
  if (score >= 70) return { zh: "懒洋洋地开心", en: "Lazy-happy" };
  if (score >= 40) return { zh: "有点想睡觉", en: "Sleepy" };
  if (score >= 20) return { zh: "有点被冷落", en: "A little neglected" };
  return { zh: "想你们了", en: "Misses you" };
}

export function CatMascot({
  mood = 72,
  size = 220,
  patted = false,
  onPat,
}: {
  mood?: number;
  size?: number;
  patted?: boolean;
  onPat?: () => void;
}) {
  const kind = moodFromScore(mood);
  const eyes =
    kind === "happy" ? (
      <>
        <path d="M86 118c6 8 14 8 20 0" stroke="#4A3B36" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M154 118c6 8 14 8 20 0" stroke="#4A3B36" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    ) : kind === "lazy" ? (
      <>
        <path d="M84 122c8-2 18-2 26 0" stroke="#4A3B36" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M150 122c8-2 18-2 26 0" stroke="#4A3B36" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <circle cx="97" cy="122" r="6" fill="#4A3B36" />
        <circle cx="163" cy="122" r="6" fill="#4A3B36" />
        <path d="M88 112c6 2 10 2 16 0" stroke="#4A3B36" strokeWidth="3" strokeLinecap="round" />
        <path d="M156 112c6 2 10 2 16 0" stroke="#4A3B36" strokeWidth="3" strokeLinecap="round" />
      </>
    );

  const mouth =
    kind === "sad" ? (
      <path d="M118 150c8-7 16-7 24 0" stroke="#4A3B36" strokeWidth="4" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M118 146c8 9 16 9 24 0" stroke="#4A3B36" strokeWidth="4" strokeLinecap="round" fill="none" />
    );

  return (
    <button
      type="button"
      onClick={onPat}
      className={`relative mx-auto block select-none ${patted ? "wiggle" : "floaty"} ${onPat ? "cursor-pointer" : "cursor-default"}`}
      style={{ width: size, height: size }}
      aria-label="摸摸猫 Pat the cat"
    >
      <svg viewBox="0 0 260 250" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="130" cy="220" rx="88" ry="16" fill="#EFD6C8" />
        <ellipse cx="130" cy="206" rx="78" ry="22" fill="#F4C9C6" />
        <path d="M48 128c-18 28-10 62 28 70" stroke="#E8B48A" strokeWidth="16" strokeLinecap="round" />
        <path d="M52 40 92 86" stroke="#E8B48A" strokeWidth="28" strokeLinecap="round" />
        <path d="M208 40 168 86" stroke="#E8B48A" strokeWidth="28" strokeLinecap="round" />
        <path d="M58 52 84 42" stroke="#F6D0C4" strokeWidth="8" strokeLinecap="round" />
        <path d="M202 52 176 42" stroke="#F6D0C4" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="130" cy="138" rx="86" ry="78" fill="#E8B48A" />
        <ellipse cx="92" cy="148" rx="22" ry="14" fill="#F3C2B1" opacity="0.85" />
        <ellipse cx="168" cy="148" rx="22" ry="14" fill="#F3C2B1" opacity="0.85" />
        {eyes}
        <path d="M124 136c2 8 10 8 12 0" stroke="#C36B76" strokeWidth="4" strokeLinecap="round" fill="none" />
        {mouth}
        <path d="M130 140 92 148" stroke="#C36B76" strokeWidth="2" opacity="0.55" />
        <path d="M130 140 88 140" stroke="#C36B76" strokeWidth="2" opacity="0.45" />
        <path d="M130 140 168 148" stroke="#C36B76" strokeWidth="2" opacity="0.55" />
        <path d="M130 140 172 140" stroke="#C36B76" strokeWidth="2" opacity="0.45" />
        {kind === "happy" && (
          <>
            <circle cx="58" cy="86" r="4" fill="#E8A0A8" />
            <circle cx="204" cy="92" r="3" fill="#E8A0A8" />
            <path d="M40 70l6 2-6 2" stroke="#E8A0A8" strokeWidth="2" />
            <path d="M214 68l6 2-6 2" stroke="#E8A0A8" strokeWidth="2" />
          </>
        )}
      </svg>
    </button>
  );
}
