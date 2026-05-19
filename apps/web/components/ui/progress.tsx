import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success";
}

export function Progress({ value, className, size = "md", variant = "primary" }: ProgressProps) {
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const colors = {
    primary: "from-violet-500 to-fuchsia-500",
    success: "from-emerald-500 to-teal-500",
  };
  return (
    <div className={cn("w-full bg-zinc-800 rounded-full overflow-hidden", heights[size], className)}>
      <div
        className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-in-out", colors[variant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
