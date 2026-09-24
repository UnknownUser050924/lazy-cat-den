import type { Profile } from "./types";

export function emptyProfile(): Profile {
  return {
    gender: "",
    signature: "",
    vibes: [],
    formId: "sleepy",
    thinking: "",
    need: "",
    want: "",
    pocket: {},
    wall: "cozy",
    objects: [],
    knowMe: [],
    guesses: [],
    characterId: "",
    avatarKind: "",
    avatarFile: "",
    frameId: "",
    themeId: "",
    effectId: "none",
    bio: "",
  };
}
