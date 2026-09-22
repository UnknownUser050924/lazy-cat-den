import type { ReactNode } from "react";
import { RoomShell } from "@/components/RoomShell";

export default async function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  return <RoomShell room={decodeURIComponent(room)}>{children}</RoomShell>;
}
