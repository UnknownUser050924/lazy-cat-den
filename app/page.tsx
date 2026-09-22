import { JoinForm } from "@/components/JoinForm";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; joined?: string }>;
}) {
  const params = await searchParams;
  return <JoinForm initialRoom={params.room ?? ""} joined={params.joined ?? ""} />;
}
