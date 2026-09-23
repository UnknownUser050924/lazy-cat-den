"use client";

import { useEffect } from "react";
import type { CatPose } from "@/lib/cottage";

export const CAT_SRC: Record<CatPose, string> = {
  idle: "/assets/cat/cat-idle.png",
  happy: "/assets/cat/cat-happy.png",
  sleepy: "/assets/cat/cat-sleepy.png",
  playing: "/assets/cat/cat-playing.png",
  eating: "/assets/cat/cat-eating.png",
  window: "/assets/cat/cat-window.jpg",
  surprised: "/assets/cat/cat-surprised.png",
};

const POSE_LABEL: Record<CatPose, string> = {
  idle: "懒猫坐着",
  happy: "懒猫很开心",
  sleepy: "懒猫在睡觉",
  playing: "懒猫在玩毛线",
  eating: "懒猫在吃饭",
  window: "懒猫看着窗外",
  surprised: "懒猫吓了一跳",
};

let warmed = false;

function warmCatPhotos() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const src of Object.values(CAT_SRC)) {
    const image = new Image();
    image.src = src;
  }
}

export function moodLabel(score: number) {
  if (score >= 85) return { zh: "精神满满", en: "Bright" };
  if (score >= 70) return { zh: "很开心", en: "Happy" };
  if (score >= 40) return { zh: "有点困", en: "A little sleepy" };
  if (score >= 20) return { zh: "好像饿了", en: "Seems hungry" };
  return { zh: "想被摸摸", en: "Wants a pat" };
}

export function CatMascot({
  pose = "idle",
  size = 220,
  patted = false,
  onPat,
}: {
  pose?: CatPose;
  size?: number;
  patted?: boolean;
  onPat?: () => void;
}) {
  useEffect(() => {
    warmCatPhotos();
  }, []);

  const motion = patted || pose === "playing" ? "wiggle" : pose === "happy" ? "floaty" : pose === "sleepy" ? "" : "floaty";

  return (
    <button
      type="button"
      onClick={onPat}
      className={`cat-stage relative mx-auto block select-none ${motion} ${onPat ? "cursor-pointer" : "cursor-default"}`}
      style={{ width: size, height: size }}
      aria-label={onPat ? "摸摸猫 Pat the cat" : POSE_LABEL[pose]}
    >
      <img
        key={pose}
        src={CAT_SRC[pose]}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="cat-photo pointer-events-none"
      />
    </button>
  );
}
