"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, GripVertical, RefreshCw, ImageIcon, MoveUp, MoveDown } from "lucide-react";
import { useState } from "react";

// Mock storyboard data structure
interface Scene {
  id: string;
  sequence: number;
  description: string;
  imagePrompt: string;
  duration: number;
  transition: string;
  imageUrl?: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export default function StoryboardPage() {
  const { id } = useParams<{ id: string }>();
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "1", sequence: 1, description: "产品外观展示 · 3/4角度", imagePrompt: "Product hero shot, 3/4 angle, studio lighting", duration: 5, transition: "fade", status: "completed", imageUrl: "" },
    { id: "2", sequence: 2, description: "核心卖点：超长续航", imagePrompt: "Battery life infographic, futuristic HUD style", duration: 4, transition: "slide", status: "completed", imageUrl: "" },
    { id: "3", sequence: 3, description: "使用场景：户外运动", imagePrompt: "Outdoor sports lifestyle, golden hour lighting", duration: 6, transition: "fade", status: "generating", imageUrl: "" },
    { id: "4", sequence: 4, description: "对比竞品优势", imagePrompt: "Split screen comparison, clean minimal style", duration: 5, transition: "cut", status: "pending" },
    { id: "5", sequence: 5, description: "CTA · 立即购买", imagePrompt: "Call to action, product + price overlay", duration: 3, transition: "zoom", status: "pending" },
  ]);

  const moveScene = (from: number, to: number) => {
    const updated = [...scenes];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved!);
    setScenes(updated.map((s, i) => ({ ...s, sequence: i + 1 })));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />返回项目
          </Link>
          <h1 className="text-2xl font-bold">分镜编辑器</h1>
          <p className="text-sm text-zinc-400 mt-1">拖拽排序 · AI 图片生成 · 预览故事板</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><RefreshCw className="w-4 h-4" />全部重绘</Button>
          <Button size="sm"><Plus className="w-4 h-4" />添加镜头</Button>
        </div>
      </div>

      {/* Scene list */}
      <div className="space-y-3">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-all">
            {/* Drag handle + order */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <button className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors" onClick={() => idx > 0 && moveScene(idx, idx - 1)}>
                <MoveUp className="w-4 h-4" />
              </button>
              <GripVertical className="w-4 h-4 text-zinc-700 cursor-grab" />
              <span className="text-xs font-mono font-bold text-violet-400">{scene.sequence}</span>
              <button className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors" onClick={() => idx < scenes.length - 1 && moveScene(idx, idx + 1)}>
                <MoveDown className="w-4 h-4" />
              </button>
            </div>

            {/* Image placeholder */}
            <div className="flex-shrink-0 w-32 h-20 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              {scene.imageUrl ? (
                <img src={scene.imageUrl} alt={scene.description} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-zinc-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{scene.description}</p>
                <Badge variant={scene.status === "completed" ? "success" : scene.status === "generating" ? "warning" : "default"}>
                  {scene.status === "completed" ? "已生成" : scene.status === "generating" ? "生成中" : "待生成"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 truncate">{scene.imagePrompt}</p>
              <div className="flex items-center gap-4 text-xs text-zinc-600">
                <span>{scene.duration}秒</span>
                <span>转场: {scene.transition}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
