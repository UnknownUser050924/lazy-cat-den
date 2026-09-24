"use client";

import { useEffect, useRef } from "react";
import { characterOf, themeSrc } from "@/lib/look";
import { feelingOf, isHere } from "@/lib/cottage";
import { applyProfileEffect } from "@/lib/profile-effects";
import type { Member } from "@/lib/types";
import { ProfileAvatar } from "./ProfileAvatar";

export function ProfileCard({
  roomId,
  member,
  selfName,
  mine,
  onEdit,
  onCloser,
  compact = false,
}: {
  roomId: string;
  member: Member;
  selfName: string;
  mine?: boolean;
  onEdit?: () => void;
  onCloser?: () => void;
  compact?: boolean;
}) {
  const fxRef = useRef<HTMLDivElement>(null);
  const profile = member.profile;
  const character = characterOf(profile.characterId);
  const feeling = feelingOf(member.statusId);
  const here = isHere(member) || member.displayName === selfName;

  useEffect(() => {
    const node = fxRef.current;
    applyProfileEffect(node, profile.effectId);
    return () => applyProfileEffect(node, "none");
  }, [profile.effectId]);

  return (
    <article
      className="lcd-profile-card"
      style={{
        backgroundImage: themeSrc(profile.themeId) ? `url("${themeSrc(profile.themeId)}")` : undefined,
        maxWidth: compact ? "22rem" : "26rem",
        marginInline: "auto",
      }}
    >
      <div ref={fxRef} />
      <div className="lcd-card-content">
        <div className="lcd-card-top">
          <span className="lcd-room-tag">懒猫小屋</span>
          <span className="lcd-live">{here ? "在这儿" : "不在座位上"}</span>
        </div>
        <ProfileAvatar roomId={roomId} name={member.displayName} profile={profile} />
        <div className="lcd-card-info">
          <h2>{member.displayName}</h2>
          <p>
            {character ? `角色 · ${character.zh}` : "角色 · 用照片"}
            {feeling ? ` · ${feeling.zh}` : ""}
          </p>
          {profile.bio ? <p>{profile.bio}</p> : null}
          {profile.signature ? <p className="lcd-signature">{profile.signature}</p> : <p className="lcd-signature">还没写签名</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {onCloser ? (
              <button type="button" className="rounded-full bg-blush px-3 py-1.5 text-sm font-bold text-rose-deep" onClick={onCloser}>
                靠近一点
              </button>
            ) : null}
            {mine && onEdit ? (
              <button type="button" className="rounded-full bg-rose-deep px-3 py-1.5 text-sm font-bold text-white" onClick={onEdit}>
                编辑我的资料
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
