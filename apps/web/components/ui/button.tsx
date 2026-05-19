import * as React from "react";
import { cn as cnUtil } from "@/lib/utils";

function cn(...inputs: (string | undefined | false | null)[]) {
  return cnUtil(...inputs);
}

const variants = {
  primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20",
  secondary: "border border-zinc-700 hover:bg-zinc-800 text-zinc-200",
  ghost: "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200",
  danger: "bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}


