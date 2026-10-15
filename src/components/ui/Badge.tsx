import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "orange" | "green" | "blue" | "red" | "zinc" | "purple";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "zinc", size = "sm", children, ...props }: BadgeProps) {
  const variants = {
    orange: "bg-brand-50 text-brand-700 border border-brand-200 font-semibold",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
    blue: "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
    red: "bg-red-50 text-red-700 border border-red-200 font-medium",
    zinc: "bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium",
    purple: "bg-purple-50 text-purple-700 border border-purple-200 font-medium",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs rounded-full",
    md: "px-3 py-1 text-xs rounded-md",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
