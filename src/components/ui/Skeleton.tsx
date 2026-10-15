import React from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200/70 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
