"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Video, Sparkles } from "lucide-react";

interface ModelInfo {
  name: string; display_name: string; type: string;
  description: string; tags: string[]; input_hint?: string;
}

export default function ModelsPage() {
  const [imageModels, setImageModels] = useState<ModelInfo[]>([]);
  const [videoModels, setVideoModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/models?type=image").then((r) => r.json()),
      fetch("/api/models?type=video").then((r) => r.json()),
    ]).then(([img, vid]) => {
      setImageModels(img.models || []);
      setVideoModels(vid.models || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sections: { type: string; title: string; icon: typeof ImageIcon; models: ModelInfo[] }[] = [
    { type: "image", title: "图片生成", icon: ImageIcon, models: imageModels },
    { type: "video", title: "视频生成", icon: Video, models: videoModels },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">大模型列表</h1>
          <p className="text-sm text-zinc-400 mt-1">
            灵客平台可用模型 · 点击模型名称可复制到剪贴板
          </p>
        </div>
        <Badge variant="default">
          <Sparkles className="w-3 h-3" />
          灵客 API
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500">加载中...</div>
      ) : (
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.type} className="space-y-3">
              <div className="flex items-center gap-2">
                <s.icon className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <Badge variant="default">{s.models.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {s.models.map((m) => (
                  <div
                    key={m.name}
                    className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2 hover:border-zinc-700 transition-all cursor-pointer"
                    onClick={() => { navigator.clipboard.writeText(m.name); }}
                    title="点击复制模型名称"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{m.display_name}</h3>
                      <span className="text-[10px] text-zinc-600 font-mono">{m.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{m.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
