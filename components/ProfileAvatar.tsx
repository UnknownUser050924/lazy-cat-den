"use client";

import { useState } from "react";
import { characterOf, frameSrc } from "@/lib/look";
import type { Profile } from "@/lib/types";

export function avatarUrl(roomId: string, profile: Profile) {
  if (profile.avatarKind === "upload" && profile.avatarFile) {
    return `/api/rooms/${encodeURIComponent(roomId)}/avatar/${encodeURIComponent(profile.avatarFile)}`;
  }
  return "";
}

export function ProfileAvatar({
  roomId,
  name,
  profile,
  className = "",
}: {
  roomId: string;
  name: string;
  profile: Profile;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = broken ? "" : avatarUrl(roomId, profile);
  const kind = profile.avatarKind && profile.avatarKind !== "upload" ? profile.avatarKind : "";
  const initial = name.slice(-1) || "猫";
  return (
    <div className={`lcd-avatar-wrap ${className}`}>
      <div className={`lcd-avatar-base ${kind ? `lcd-avatar-${kind}` : ""}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" onError={() => setBroken(true)} />
        ) : (
          initial
        )}
      </div>
      {profile.frameId && frameSrc(profile.frameId) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lcd-frame" src={frameSrc(profile.frameId)} alt="" />
      ) : null}
    </div>
  );
}

export function CharacterPortrait({
  characterId,
  className = "",
}: {
  characterId: string;
  className?: string;
}) {
  const art = characterOf(characterId);
  if (!art) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={art.src} alt="" />
  );
}
