import type { ReactNode } from "react";

const WIDTH = {
  read: "max-w-[42rem]",
  wide: "max-w-[70rem]",
  cat: "max-w-[36rem]",
  chat: "max-w-[42rem]",
} as const;

export function Page({
  width = "read",
  children,
  className = "",
}: {
  width?: keyof typeof WIDTH;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-shell @container mx-auto w-full min-w-0 ${WIDTH[width]} ${width === "cat" ? "text-center" : ""} ${className}`}>
      {children}
    </div>
  );
}
