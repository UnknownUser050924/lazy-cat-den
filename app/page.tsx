import { JoinForm } from "@/components/JoinForm";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; joined?: string }>;
}) {
  const params = await searchParams;
  const invitedRoom = params.room?.trim() ?? "";
  return <JoinForm initialRoom={invitedRoom} invited={Boolean(invitedRoom)} joined={params.joined ?? ""} />;
}
