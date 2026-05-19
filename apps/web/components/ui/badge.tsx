import { cn } from "@/lib/utils";

const styles = {
  default: "bg-zinc-800 text-zinc-300",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
} as const;

interface BadgeProps {
  variant?: keyof typeof styles;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-transparent", styles[variant], className)}>
      {children}
    </span>
  );
}
