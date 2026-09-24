"use client";

import { characterOf, figureClass } from "@/lib/look";
import { presenceLabel, roomSkySrc, skyPhase } from "@/lib/cottage";
import type { SeatedPerson } from "@/lib/cottage";
import type { Member } from "@/lib/types";
import { CharacterPortrait, ProfileAvatar } from "./ProfileAvatar";

export function CottageScene({
  roomId,
  selfName,
  seated,
  overflow,
  now,
  onOpen,
}: {
  roomId: string;
  selfName: string;
  seated: SeatedPerson[];
  overflow: Member[];
  now: number;
  onOpen: (name: string) => void;
}) {
  const sky = skyPhase(now);
  const src = roomSkySrc(sky);
  const bySeat = new Map(seated.map((item) => [item.seat, item]));

  return (
    <div>
      <div className="cottage-stage" role="group" aria-label="小屋客厅">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cottage-stage-bg" src={src} alt="" />
        {(["window", "sofa", "left", "right"] as const).map((seat) => {
          const item = bySeat.get(seat);
          if (!item) return null;
          const { member, kind } = item;
          const art = kind === "character" ? characterOf(member.profile.characterId) : null;
          const status = presenceLabel(member, selfName, now);
          return (
            <button
              key={seat}
              type="button"
              className={`cottage-person cottage-person-${seat}${kind === "marker" ? " is-marker" : ""}`}
              aria-label={`${member.displayName}，${status}`}
              onClick={() => onOpen(member.displayName)}
            >
              <span className="cottage-chip">
                {member.displayName}
                <span className="block font-medium opacity-80">{status}</span>
              </span>
              {art ? (
                <CharacterPortrait characterId={art.id} className={figureClass(art.id)} />
              ) : (
                <span className="cottage-marker">
                  <ProfileAvatar roomId={roomId} name={member.displayName} profile={member.profile} className="cottage-marker-avatar" />
                </span>
              )}
            </button>
          );
        })}
        <div className="cottage-fg cottage-fg-bench" style={{ backgroundImage: `url("${src}")` }} aria-hidden />
        <div className="cottage-fg cottage-fg-table" style={{ backgroundImage: `url("${src}")` }} aria-hidden />
        <div className="cottage-fg cottage-fg-pouf" style={{ backgroundImage: `url("${src}")` }} aria-hidden />
        <div className="cottage-fg cottage-fg-left-arm" style={{ backgroundImage: `url("${src}")` }} aria-hidden />
      </div>
      {overflow.length ? (
        <div className="cottage-overflow mt-3" aria-label="也在这儿">
          <p className="cottage-overflow-label">还在这儿，先坐在画外面</p>
          {overflow.map((member) => {
            const art = characterOf(member.profile.characterId);
            return (
              <button
                key={member.displayName}
                type="button"
                className="cottage-overflow-card"
                onClick={() => onOpen(member.displayName)}
              >
                <ProfileAvatar roomId={roomId} name={member.displayName} profile={member.profile} className="cottage-overflow-avatar" />
                <span>
                  <span className="block font-bold">{member.displayName}</span>
                  <span className="block text-xs font-medium opacity-80">
                    {presenceLabel(member, selfName, now)}
                    {art ? ` · ${art.zh}` : " · 用照片"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
