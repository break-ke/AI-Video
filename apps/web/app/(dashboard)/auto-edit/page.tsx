"use client";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModelSelector } from "@/components/dashboard/model-selector";
import {
  Scissors, Play, Film, Check, ImageIcon, AlertCircle,
  Loader2, RefreshCw, Download, X, Trash2, Clock, ExternalLink
} from "lucide-react";

interface VideoRecord { id: string; videoUrl: string; prompt: string; imageCount: number; model: string; createdAt: number; }

const STORAGE_KEY = "videoforge_video_history";

function loadHistory(): VideoRecord[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveHistory(records: VideoRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
}

export default function AutoEditPage() {
  const { data: dbScenes, isLoading } = trpc.storyboard.listConfirmed.useQuery(undefined);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [videoModel, setVideoModel] = useState("seedance2.0");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoHistory, setVideoHistory] = useState<VideoRecord[]>(() => loadHistory());
  const [errorMsg, setErrorMsg] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastImageUrls, setLastImageUrls] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const scenes = dbScenes || [];
  const selectedScenes = scenes.filter((s) => selectedIds.has(s.id));

  const toggleScene = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === scenes.length && scenes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scenes.map((s) => s.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedScenes.length === 0) return;
    setGenerating(true);
    setGenProgress(5);
    setGenStage("提交视频生成任务...");
    setErrorMsg("");
    setVideoUrl("");

    const imageUrls: string[] = selectedScenes
      .map((s) => s.generatedImageUrl)
      .filter((url): url is string => !!url && (url.startsWith("http") || url.startsWith("data:")));

    if (imageUrls.length === 0) {
      setErrorMsg("选中的分镜没有有效图片URL");
      setGenerating(false);
      return;
    }

    setLastPrompt(prompt);
    setLastImageUrls(imageUrls);

    try {
      setGenProgress(15);
      setGenStage(videoModel.startsWith("seedance") ? "即梦 Seedance 处理中..." : "灵客视频生成中...");

      const res = await fetch("/api/auto-edit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), imageUrls, model: videoModel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setGenProgress(100);
      setGenStage("完成!");
      setVideoUrl(data.videoUrl);

      // Save to history
      const record: VideoRecord = {
        id: Date.now().toString(36), videoUrl: data.videoUrl,
        prompt: prompt.trim() || "未填写提示词", imageCount: selectedScenes.length,
        model: data.model || videoModel, createdAt: Date.now(),
      };
      const updated = [record, ...videoHistory];
      setVideoHistory(updated);
      saveHistory(updated);

      if (pollRef.current) clearInterval(pollRef.current);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setGenerating(false);
      setGenProgress(100);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  };

  const handleRegenerate = () => {
    setVideoUrl("");
    setErrorMsg("");
    handleGenerate();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="w-6 h-6 text-violet-400" />
            自动剪辑配音
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            选择已确认的分镜图片，AI 融合生成视频短片
          </p>
        </div>
        <ModelSelector type="video" value={videoModel} onChange={setVideoModel} />
      </div>

      {/* Storyboard Scene Selection */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Film className="w-4 h-4 text-zinc-400" />
            选择分镜图片
            <span className="text-zinc-600 font-normal">
              (从故事板已确认列表中选取，至少 1 张)
            </span>
          </h2>
          <button
            onClick={selectAll}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {selectedIds.size === scenes.length && scenes.length > 0 ? "取消全选" : "全选"}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">加载中...</div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm space-y-2">
            <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto" />
            <p>暂无已确认的分镜图片</p>
            <p className="text-xs text-zinc-600">请先在故事板生成页面确认分镜</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {scenes.map((scene, i) => {
              const isSelected = selectedIds.has(scene.id);
              return (
                <button
                  key={scene.id}
                  onClick={() => toggleScene(scene.id)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    isSelected
                      ? "border-violet-400 ring-1 ring-violet-400/30"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className="aspect-square bg-zinc-900 flex items-center justify-center">
                    {scene.generatedImageUrl ? (
                      <img
                        src={scene.generatedImageUrl}
                        alt={scene.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-700" />
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="p-2 bg-zinc-900/80 backdrop-blur">
                    <p className="text-[10px] text-zinc-400 line-clamp-1">#{i + 1} {scene.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedScenes.length > 0 && (
          <p className="text-xs text-violet-400">已选 {selectedScenes.length} 张图片</p>
        )}
      </div>

      {/* Prompt Input & Generate */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            视频提示词
            <span className="text-zinc-600 font-normal"> (非必填，描述期望的视频效果)</span>
          </label>
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="如：产品360度展示，柔光环境，镜头缓慢推进..."
              rows={2}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
            />
            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={selectedScenes.length === 0}
              className="self-end"
            >
              <Scissors className="w-4 h-4" />
              一键生成视频
            </Button>
          </div>
        </div>

        {/* Progress */}
        {generating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                {genStage}
              </span>
              <span>{genProgress}%</span>
            </div>
            <Progress value={genProgress} />
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">生成失败</p>
              <p className="text-red-400/70">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400/50 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Generated Video */}
      {videoUrl && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-emerald-400">视频生成完成</h2>
          </div>

          <video
            src={videoUrl}
            controls
            className="w-full max-h-[60vh] rounded-xl bg-black"
            poster={lastImageUrls[0]}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <a href={videoUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                <Download className="w-3.5 h-3.5" />下载视频
              </Button>
            </a>
            <span className="text-xs text-zinc-500">SD 2.0 参考生 · 720p</span>
          </div>

          {/* Re-generate with adjusted prompt */}
          <div className="border-t border-emerald-500/10 pt-4 space-y-3">
            <h3 className="text-sm text-zinc-300">调整提示词重新生成</h3>
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="修改提示词后再次调用模型..."
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              />
              <Button onClick={handleRegenerate} loading={generating} variant="secondary" className="self-end">
                <RefreshCw className="w-4 h-4" />重新生成
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video History */}
      {videoHistory.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            生成记录 · {videoHistory.length}
          </h2>
          <div className="space-y-2">
            {videoHistory.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-all">
                <video src={rec.videoUrl} className="w-20 h-14 object-cover rounded-lg bg-black" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 line-clamp-1">{rec.prompt}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {rec.imageCount}张图 · {rec.model} · {new Date(rec.createdAt).toLocaleTimeString("zh-CN")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={rec.videoUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="新窗口打开">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => { const updated = videoHistory.filter((v) => v.id !== rec.id); setVideoHistory(updated); saveHistory(updated); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors" title="删除">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && scenes.length === 0 && !videoUrl && videoHistory.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-zinc-700" />
          </div>
          <h3 className="text-zinc-500 font-medium">暂无分镜素材</h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            请先在故事板生成页面生成并确认分镜图片，然后在此处选择图片生成视频。
          </p>
        </div>
      )}
    </div>
  );
}
