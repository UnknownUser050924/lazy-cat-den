import { Suspense } from "react";
import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-muted">
          懒猫在伸懒腰… stretching…
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
