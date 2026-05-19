"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Download, Share2, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const [exporting, setExporting] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />返回项目
        </Link>
        <h1 className="text-2xl font-bold">视频预览</h1>
      </div>

      {/* Player */}
      <div className="relative aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center group">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto group-hover:bg-violet-500/20 transition-colors">
            <Play className="w-10 h-10 text-violet-400 ml-1" />
          </div>
          <p className="text-zinc-500 text-sm">点击播放最终视频</p>
        </div>
        {/* Placeholder for actual video player */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <div className="h-full w-0 bg-violet-500 rounded-r" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => setExporting(true)} loading={exporting}>
          <Download className="w-4 h-4" />
          {exporting ? "导出中..." : "下载 MP4"}
        </Button>
        <Button variant="secondary"><Share2 className="w-4 h-4" />分享链接</Button>
        <Button variant="secondary"><Copy className="w-4 h-4" />复制模板</Button>
      </div>

      {/* Quality Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "视觉质量", score: 92, icon: CheckCircle, color: "text-emerald-400" },
          { label: "音频质量", score: 88, icon: CheckCircle, color: "text-emerald-400" },
          { label: "品牌一致性", score: 95, icon: CheckCircle, color: "text-emerald-400" },
        ].map((q) => (
          <div key={q.label} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{q.label}</span>
              <q.icon className={`w-4 h-4 ${q.color}`} />
            </div>
            <p className={`text-2xl font-bold ${q.color}`}>{q.score}</p>
            <Progress value={q.score} size="sm" variant="success" />
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h3 className="font-semibold text-sm">导出设置</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["1080p · MP4", "720p · MP4", "竖版 9:16", "GIF · 15s"].map((f) => (
            <button key={f} className="p-3 rounded-xl border border-zinc-800 hover:border-violet-500/30 text-sm text-zinc-400 hover:text-zinc-200 transition-all text-center">
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Warnings */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-amber-400 font-medium">视频生产提示</p>
          <p className="text-zinc-500 mt-1">当前使用即梦 API 生成视频片段 + FFmpeg 本地合成。视频片段 URL 有效期 24 小时，请及时导出。</p>
        </div>
      </div>
    </div>
  );
}
