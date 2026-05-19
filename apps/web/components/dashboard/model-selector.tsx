"use client";
import { useState, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

export interface ModelInfo { name: string; display_name: string; tags: string[]; description: string; }

interface Props {
  type: "image" | "video";
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ type, value, onChange }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/models?type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        const list: ModelInfo[] = d.models || [];
        if (type === "video") {
          list.unshift(
            { name: "seedance2.0fast", display_name: "即梦 Seedance 2.0 Fast", tags: ["图生视频", "非VIP", "快速"], description: "本地 dreamina CLI · Seedance 2.0 Fast · 快速生成" },
            { name: "seedance2.0", display_name: "即梦 Seedance 2.0", tags: ["图生视频", "非VIP", "高画质"], description: "本地 dreamina CLI · Seedance 2.0 · 旗舰画质" },
          );
        }
        setModels(list);
      })
      .catch(() => {});
  }, [type]);

  const selected = models.find((m) => m.name === value) ||
    (value === "seedance2.0" ? { name: "seedance2.0", display_name: "即梦 Seedance 2.0", tags: [], description: "本地 dreamina CLI" } :
     value === "seedance2.0fast" ? { name: "seedance2.0fast", display_name: "即梦 Seedance 2.0 Fast", tags: [], description: "本地 dreamina CLI" } : undefined);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-300 hover:border-zinc-600 transition-colors"
      >
        <Sparkles className="w-3 h-3 text-violet-400" />
        <span className="max-w-[120px] truncate">{selected?.display_name || value}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-72 max-h-64 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl z-20">
            {models.length === 0 && (
              <div className="p-4 text-xs text-zinc-500 text-center">加载中...</div>
            )}
            {models.map((m) => (
              <button
                key={m.name}
                onClick={() => { onChange(m.name); setOpen(false); }}
                className={`w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0 ${
                  m.name === value ? "bg-violet-500/10 border-l-2 border-l-violet-400" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">{m.display_name}</span>
                  <span className="text-[10px] text-zinc-600">{m.name}</span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{m.description}</p>
                <div className="flex gap-1 mt-1">
                  {m.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-500">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
