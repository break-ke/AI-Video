"use client";
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModelSelector } from "@/components/dashboard/model-selector";
import {
  Send, Check, X, RefreshCw, ImageIcon, Trash2, Upload, Sparkles,
  Eye, Clock, AlertCircle, ChevronUp, ChevronDown, Loader2, Film, Maximize2, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";

interface GeneratedScene {
  id: string;
  prompt: string;
  referenceImage?: string;
  enhancedPrompt?: string;
  sceneDescription?: string;
  generatedImageUrl?: string;
  status: "generating" | "done" | "rejected";
  error?: string;
}

interface ConfirmedScene {
  id: string;
  description: string;
  imagePrompt: string;
  generatedImageUrl: string;
  referenceImageUrl?: string;
  sequence: number;
  createdAt: string;
}

const DEFAULT_PROMPT = "产品外观展示 · 3/4角度 · 柔和工作室光线 · 浅景深 · 极简白色背景 · 电影感";

export default function StoryboardPage() {
  const utils = trpc.useUtils();
  const { data: dbScenes, isLoading: dbLoading } = trpc.storyboard.listConfirmed.useQuery();
  const createScene = trpc.storyboard.createScene.useMutation();
  const deleteScene = trpc.storyboard.deleteScene.useMutation();

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState("");
  const [pendingScenes, setPendingScenes] = useState<GeneratedScene[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [referenceBase64, setReferenceBase64] = useState("");
  const [imageModel, setImageModel] = useState("gpt-image-2");
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; title: string; prompt: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const openLightbox = (url: string, title: string, prompt: string) => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLightbox({ url, title, prompt });
  };

  const closeLightbox = () => {
    setLightbox(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // ── Image upload handling ──
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setReferenceBase64(b64 || "");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearReference = () => {
    setPreviewUrl("");
    setReferenceBase64("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Generate storyboard scene ──
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenProgress(10);
    setGenStage("提交生成请求...");
    setErrorMsg("");

    const sceneId = `temp_${Date.now()}`;
    const newScene: GeneratedScene = { id: sceneId, prompt, referenceImage: previewUrl, status: "generating" };
    setPendingScenes((prev) => [newScene, ...prev]);

    try {
      setGenProgress(25);
      setGenStage("GPT-5.5 优化提示词中...");

      const res = await fetch("/api/storyboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), referenceImageBase64: referenceBase64 || undefined, model: imageModel }),
      });

      setGenProgress(80);
      setGenStage("GPT Image 2 生成图片中...");

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setGenProgress(100);
      setGenStage("完成!");

      setPendingScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                status: "done",
                enhancedPrompt: data.enhancedPrompt,
                sceneDescription: data.sceneDescription,
                generatedImageUrl: data.generatedImageUrl,
                error: data.imageGenError || undefined,
              }
            : s
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setPendingScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, status: "rejected", error: msg } : s))
      );
    } finally {
      setGenerating(false);
      setGenProgress(0);
      setGenStage("");
    }
  };

  // ── Confirm scene → save to DB ──
  const handleConfirm = async (scene: GeneratedScene) => {
    try {
      await createScene.mutateAsync({
        description: scene.sceneDescription || scene.prompt,
        imagePrompt: scene.enhancedPrompt || scene.prompt,
        generatedImageUrl: scene.generatedImageUrl || "",
        referenceImageUrl: scene.referenceImage || "",
      });
      utils.storyboard.listConfirmed.invalidate();
      setPendingScenes((prev) => prev.filter((s) => s.id !== scene.id));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "保存失败");
    }
  };

  // ── Reject scene ──
  const handleReject = (scene: GeneratedScene) => {
    setPendingScenes((prev) => prev.filter((s) => s.id !== scene.id));
    const regenerate = confirm("是否重新生成这个分镜？将使用相同提示词再次调用模型。");
    if (regenerate) {
      setPrompt(scene.prompt);
      if (scene.referenceImage) setPreviewUrl(scene.referenceImage);
    }
  };

  // ── Delete confirmed scene ──
  const handleDelete = async (id: string) => {
    await deleteScene.mutateAsync({ id });
    utils.storyboard.listConfirmed.invalidate();
  };

  // ── Move scene (reorder in pending) ──
  const moveScene = (id: string, dir: -1 | 1) => {
    setPendingScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0 || (dir === -1 && idx === 0) || (dir === 1 && idx >= prev.length - 1)) return prev;
      const updated = [...prev];
      [updated[idx + dir], updated[idx]] = [updated[idx]!, updated[idx + dir]!];
      return updated;
    });
  };

  const confirmedScenes: ConfirmedScene[] = (dbScenes || []).map((s) => ({
    id: s.id,
    description: s.description,
    imagePrompt: s.imagePrompt,
    generatedImageUrl: s.generatedImageUrl || "",
    referenceImageUrl: s.referenceImageUrl || "",
    sequence: s.sequence,
    createdAt: s.id, // proxy for date
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-violet-400" />
            故事板生成
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            输入分镜描述，AI 优化提示词并生成画面。可选上传参考图获得更精准的结果。
          </p>
        </div>
        <ModelSelector type="image" value={imageModel} onChange={setImageModel} />
      </div>

      {/* Prompt Input */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        {/* Optional: Reference image upload */}
        <div>
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5 mb-2">
            <Upload className="w-3.5 h-3.5" />
            参考图片
            <span className="text-zinc-600 font-normal">（非必填，上传后结合图片分析生成）</span>
          </label>
          {previewUrl ? (
            <div className="relative inline-block">
              <img src={previewUrl} alt="参考图" className="w-32 h-32 object-cover rounded-xl border border-zinc-700" />
              <button
                onClick={clearReference}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? "border-violet-400 bg-violet-500/5" : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/30"
              }`}
            >
              <ImageIcon className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">拖放参考图片或点击上传</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">分镜描述</label>
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的画面..."
              rows={2}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleGenerate())}
            />
            <Button onClick={handleGenerate} loading={generating} className="self-end">
              <Send className="w-4 h-4" />生成
            </Button>
          </div>
        </div>

        {/* Progress bar */}
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

        {/* Error message */}
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

      {/* Pending Confirmation Scenes */}
      {pendingScenes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            待确认分镜
            <Badge variant="default">{pendingScenes.filter((s) => s.status !== "rejected").length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingScenes.map((scene, idx) => (
              <div
                key={scene.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  scene.status === "generating"
                    ? "border-amber-500/20 bg-amber-500/5"
                    : scene.status === "rejected"
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                {/* Image Area */}
                <div className="aspect-square bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-center relative">
                  {scene.status === "generating" ? (
                    <div className="text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                      <p className="text-xs text-zinc-500">AI 生成中...</p>
                    </div>
                  ) : scene.status === "rejected" ? (
                    <div className="text-center space-y-2 p-4">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                      <p className="text-xs text-red-400">{scene.error || "生成失败"}</p>
                    </div>
                  ) : scene.generatedImageUrl ? (
                    scene.generatedImageUrl.startsWith("data:") || scene.generatedImageUrl.startsWith("http") ? (
                      <div className="relative w-full h-full group cursor-pointer" onClick={() => openLightbox(scene.generatedImageUrl!, scene.sceneDescription || scene.prompt, scene.enhancedPrompt || scene.prompt)}>
                        <img
                          src={scene.generatedImageUrl}
                          alt={scene.sceneDescription || scene.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <Eye className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-500">图片生成中，请稍候重试</p>
                        <p className="text-[10px] text-zinc-600 line-clamp-3">{scene.generatedImageUrl}</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-500">等待生成</p>
                    </div>
                  )}

                  {/* Reference image thumbnail */}
                  {scene.referenceImage && (
                    <div className="absolute top-2 left-2 w-10 h-10 rounded-lg border border-zinc-600 overflow-hidden bg-zinc-900/80 backdrop-blur">
                      <img src={scene.referenceImage} alt="参考" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-zinc-400 line-clamp-2" title={scene.enhancedPrompt || scene.prompt}>
                    {scene.sceneDescription || scene.prompt}
                  </p>
                  {scene.enhancedPrompt && (
                    <p className="text-[10px] text-zinc-600 line-clamp-2" title={scene.enhancedPrompt}>
                      提示词: {scene.enhancedPrompt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">#{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveScene(scene.id, -1)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveScene(scene.id, 1)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {scene.status === "done" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirm(scene)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />确认
                      </button>
                      <button
                        onClick={() => handleReject(scene)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Scenes → Auto Edit List */}
      {confirmedScenes.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-emerald-400">已确认 · 将进入自动剪辑列表</h2>
            <Badge variant="success">{confirmedScenes.length} 个分镜</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {confirmedScenes.map((scene, i) => (
              <div key={scene.id} className="group rounded-xl border border-emerald-500/10 bg-zinc-900/30 overflow-hidden hover:border-emerald-500/30 transition-all">
                <div className="aspect-square bg-zinc-900 flex items-center justify-center relative">
                  {scene.generatedImageUrl ? (
                    <div className="relative w-full h-full group cursor-pointer" onClick={() => openLightbox(scene.generatedImageUrl, scene.description, scene.imagePrompt)}>
                      <img src={scene.generatedImageUrl} alt={scene.description} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-700" />
                  )}
                  <button
                    onClick={() => handleDelete(scene.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-2 left-2 text-[10px] bg-zinc-900/80 backdrop-blur px-1.5 py-0.5 rounded text-zinc-400">
                    #{i + 1}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-zinc-500 line-clamp-2">{scene.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary tags */}
          <div className="flex flex-wrap gap-2">
            {confirmedScenes.map((s, i) => (
              <Badge key={s.id} variant="default" className="text-[10px]">
                #{i + 1} {s.description.slice(0, 25)}...
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!dbLoading && pendingScenes.length === 0 && confirmedScenes.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8 text-zinc-700" />
          </div>
          <h3 className="text-zinc-500 font-medium">开始生成你的第一个分镜</h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            在上方输入分镜描述，可选上传参考图片。AI 将优化你的提示词并生成画面，确认后可进入自动剪辑。
          </p>
        </div>
      )}

      {/* Lightbox Preview with Zoom */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.25 : 0.25;
            setZoom((z) => Math.max(0.25, Math.min(5, z + delta)));
          }}
        >
          {/* Toolbar */}
          <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">{lightbox.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.5))}
                disabled={zoom <= 0.25}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-300 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.5))}
                disabled={zoom >= 5}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-1"
                title="重置"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={closeLightbox}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            onMouseDown={(e) => {
              if (zoom > 1) {
                setDragging(true);
                dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
              }
            }}
            onMouseMove={(e) => {
              if (dragging && zoom > 1) {
                setPan({
                  x: dragStart.current.panX + (e.clientX - dragStart.current.x),
                  y: dragStart.current.panY + (e.clientY - dragStart.current.y),
                });
              }
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onDoubleClick={() => {
              if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
              else setZoom(2);
            }}
            style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.title}
              draggable={false}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none transition-transform duration-150"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              onClick={closeLightbox}
            />
          </div>

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 py-3 px-4 bg-gradient-to-t from-black/80 to-transparent z-10">
            <p className="text-xs text-zinc-400 text-center max-w-lg mx-auto line-clamp-2">{lightbox.prompt}</p>
          </div>
        </div>
      )}
    </div>
  );
}
