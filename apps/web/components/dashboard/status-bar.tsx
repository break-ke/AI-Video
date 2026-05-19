"use client";
import { FolderOpen, Brain, Layers } from "lucide-react";

export function StatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 text-[11px] text-zinc-500 z-50 select-none">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <FolderOpen className="w-3 h-3" />
          <span>D:\claude\AiPloject\video-marketing-platform</span>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-violet-400" />
          <span className="text-zinc-400">Gemini 3.1 Pro</span>
          <span className="text-zinc-600">(灵客)</span>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <span>上下文: <span className="text-zinc-400">1M tokens</span></span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span>DeepSeek V4 Pro · 灵客 Gemini 3.1 Pro · SQLite · NextAuth.js</span>
        <span className="text-zinc-700">|</span>
        <span>VideoForge v0.1</span>
      </div>
    </div>
  );
}
