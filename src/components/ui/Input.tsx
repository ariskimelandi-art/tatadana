import React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400",
              "transition-all duration-150 outline-none",
              "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:shadow-sm",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-400 focus:border-red-500 focus:ring-red-500/15",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
