"use client";

import { characterOf, figureClass } from "@/lib/look";
import { presenceLabel, skyPhase } from "@/lib/cottage";
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
  seated: Array<{ seat: string; member: Member }>;
  overflow: Member[];
  now: number;
  onOpen: (name: string) => void;
}) {
  const night = skyPhase(now) === "night";
  const bySeat = new Map(seated.map((item) => [item.seat, item.member]));
  const seats = ["window", "sofa", "left", "right"];

  return (
    <div>
      <div className="cottage-stage" role="group" aria-label="小屋客厅">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="cottage-stage-bg"
          src={night ? "/assets/cottage/lazy-cat-room-night.png" : "/assets/cottage/lazy-cat-room-day.png"}
          alt=""
        />
        {seats.map((seat) => {
          const member = bySeat.get(seat);
          if (!member) return null;
          const art = characterOf(member.profile.characterId);
          const status = presenceLabel(member, selfName, now);
          return (
            <button
              key={seat}
              type="button"
              className={`cottage-seat cottage-seat-${seat}`}
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
                <ProfileAvatar roomId={roomId} name={member.displayName} profile={member.profile} className="!m-0 !w-[58%]" />
              )}
            </button>
          );
        })}
      </div>
      {overflow.length ? (
        <div className="cottage-overflow mt-3">
          {overflow.map((member) => (
            <button
              key={member.displayName}
              type="button"
              className="rounded-full bg-blush px-3 py-1.5 text-sm font-bold text-rose-deep"
              onClick={() => onOpen(member.displayName)}
            >
              {member.displayName} · {presenceLabel(member, selfName, now)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
