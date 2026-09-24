"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AVATAR_KINDS,
  CHARACTERS,
  EFFECTS,
  FRAMES,
  THEMES,
  type AvatarKind,
  type CharacterId,
  type EffectId,
  type FrameId,
  type ThemeId,
} from "@/lib/look";
import type { Member, Profile } from "@/lib/types";
import { ProfileCard } from "./ProfileCard";

type Draft = {
  characterId: CharacterId;
  avatarKind: AvatarKind;
  frameId: FrameId;
  themeId: ThemeId;
  effectId: EffectId;
  bio: string;
};

function fromProfile(profile: Profile): Draft {
  return {
    characterId: (profile.characterId as CharacterId) || "",
    avatarKind: (profile.avatarKind as AvatarKind) || "",
    frameId: (profile.frameId as FrameId) || "",
    themeId: (profile.themeId as ThemeId) || "",
    effectId: (profile.effectId as EffectId) || "none",
    bio: profile.bio ?? "",
  };
}

async function squareCrop(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  const out = Math.min(720, size);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("这台设备裁切不了照片");
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, out, out);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("裁切失败"))), type, 0.9);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, type === "image/png" ? ".png" : ".jpg"), { type });
}

const chip = "rounded-full px-3 py-1 text-sm font-bold";
const chipOn = "bg-rose text-white";
const chipOff = "bg-blush text-rose-deep";

export function LookEditor({
  roomId,
  member,
  selfName,
  busy,
  onSave,
  onCancel,
  onUpload,
  onClearPhoto,
}: {
  roomId: string;
  member: Member;
  selfName: string;
  busy?: boolean;
  onSave: (draft: Draft) => void | Promise<void>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<void>;
  onClearPhoto: () => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(() => fromProfile(member.profile));
  const [notice, setNotice] = useState("");
  const [cropUrl, setCropUrl] = useState("");
  const cropFile = useRef<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft((cur) => ({
      ...cur,
      avatarKind: (member.profile.avatarKind as AvatarKind) || cur.avatarKind,
    }));
  }, [member.profile.avatarFile, member.profile.avatarKind]);

  useEffect(() => {
    return () => {
      if (cropUrl) URL.revokeObjectURL(cropUrl);
    };
  }, [cropUrl]);

  const preview = useMemo<Member>(
    () => ({
      ...member,
      profile: {
        ...member.profile,
        ...draft,
      },
    }),
    [member, draft],
  );

  async function pickFile(file: File) {
    setNotice("");
    const name = file.name.toLowerCase();
    if (name.endsWith(".svg") || name.endsWith(".html") || name.endsWith(".htm")) {
      setNotice("请用 JPG、PNG 或 WebP，不要上传 SVG。");
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setNotice("只要 JPG、PNG 或 WebP。");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice("照片要小于 2MB。");
      return;
    }
    try {
      const cropped = await squareCrop(file);
      cropFile.current = cropped;
      if (cropUrl) URL.revokeObjectURL(cropUrl);
      setCropUrl(URL.createObjectURL(cropped));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "这张图打不开");
    }
  }

  async function confirmCrop() {
    const file = cropFile.current;
    if (!file) return;
    try {
      await onUpload(file);
      setDraft((cur) => ({ ...cur, avatarKind: "upload" }));
      setNotice("这张照片小屋里的人都能看见。");
      if (cropUrl) URL.revokeObjectURL(cropUrl);
      setCropUrl("");
      cropFile.current = null;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "没存上");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <ProfileCard roomId={roomId} member={preview} selfName={selfName} compact />
      <div className="space-y-3">
        <fieldset>
          <legend className="text-sm font-bold">角色</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              className={`rounded-2xl px-3 py-3 text-sm font-bold ${draft.characterId === "" ? "bg-rose text-white" : "bg-blush text-rose-deep"}`}
              onClick={() => setDraft({ ...draft, characterId: "" })}
            >
              不选角色 · 用照片
            </button>
            {CHARACTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-2xl px-2 py-2 text-sm font-bold ${draft.characterId === item.id ? "bg-rose text-white" : "bg-blush/70 text-rose-deep"}`}
                onClick={() => setDraft({ ...draft, characterId: item.id })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" className="mx-auto mb-1 h-16 w-auto object-contain" />
                {item.zh}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <p className="text-sm font-bold">头像</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVATAR_KINDS.filter((item) => item.id !== "upload").map((item) => (
              <button
                key={item.id || "empty"}
                type="button"
                className={`${chip} ${draft.avatarKind === item.id ? chipOn : chipOff}`}
                onClick={() => setDraft({ ...draft, avatarKind: item.id })}
              >
                {item.zh}
              </button>
            ))}
            <button type="button" className={`${chip} ${draft.avatarKind === "upload" ? chipOn : chipOff}`} onClick={() => fileRef.current?.click()}>
              上传照片
            </button>
            {member.profile.avatarFile ? (
              <button type="button" className={`${chip} ${chipOff}`} onClick={() => void onClearPhoto()}>
                去掉照片
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void pickFile(file);
            }}
          />
          {cropUrl ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-blush/40 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cropUrl} alt="裁成方形后的预览" className="h-20 w-20 rounded-full object-cover" />
              <div className="space-y-2">
                <p className="text-xs text-muted">会裁成方形再保存。小屋里的人都能看见。</p>
                <button type="button" className="rounded-full bg-rose-deep px-3 py-1 text-sm font-bold text-white" onClick={() => void confirmCrop()}>
                  用这张照片
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">上传后小屋里的人都能看见。不要把钥匙写进文件名。</p>
          )}
        </div>
        <div>
          <p className="text-sm font-bold">相框</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FRAMES.map((item) => (
              <button
                key={item.id || "none"}
                type="button"
                className={`${chip} ${draft.frameId === item.id ? chipOn : chipOff}`}
                onClick={() => setDraft({ ...draft, frameId: item.id })}
              >
                {item.zh}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">卡片底纹</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEMES.map((item) => (
              <button
                key={item.id || "default"}
                type="button"
                className={`${chip} ${draft.themeId === item.id ? chipOn : chipOff}`}
                onClick={() => setDraft({ ...draft, themeId: item.id })}
              >
                {item.zh}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">动效</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EFFECTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${chip} ${draft.effectId === item.id ? chipOn : chipOff}`}
                onClick={() => setDraft({ ...draft, effectId: item.id })}
              >
                {item.zh}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm font-bold">
          一句话介绍
          <input
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-card px-4 py-2 font-normal text-ink"
            maxLength={80}
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            placeholder="可选，很短就好"
          />
        </label>
        {notice ? <p className="text-sm text-rose-deep">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            disabled={busy}
            onClick={() => void onSave(draft)}
          >
            套用并保存
          </button>
          <button type="button" className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-rose-deep disabled:opacity-60" disabled={busy} onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
