"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <dialog ref={ref} className={cn("bg-transparent backdrop:bg-black/60", className)}>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </dialog>
  );
}
