import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { inspectAvatar } from "./image";
import { slugifyRoom } from "./constants";

const ROOT = path.join(process.cwd(), "data", "avatars");

function safeRoom(room: string) {
  const id = slugifyRoom(room);
  if (!id) throw new Error("Invalid room");
  return id;
}

function safeFile(file: string) {
  if (!/^[a-z0-9]{8,24}\.(png|jpg|jpeg|webp)$/i.test(file)) throw new Error("找不到这张照片");
  return file.toLowerCase();
}

export function avatarDir(room: string) {
  return path.join(ROOT, safeRoom(room));
}

export function avatarPath(room: string, file: string) {
  return path.join(avatarDir(room), safeFile(file));
}

export async function writeAvatar(room: string, bytes: Uint8Array) {
  const info = inspectAvatar(bytes);
  const ext = info.kind === "jpeg" ? "jpg" : info.kind;
  const file = `${randomBytes(8).toString("hex")}.${ext}`;
  await fs.mkdir(avatarDir(room), { recursive: true });
  await fs.writeFile(avatarPath(room, file), bytes);
  return file;
}

export async function readAvatar(room: string, file: string) {
  return fs.readFile(avatarPath(room, file));
}
