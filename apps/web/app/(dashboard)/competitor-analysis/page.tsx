"use client";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import {
  LinkIcon, Upload, Play, FileText, Trash2, Download, Eye,
  Loader2, CheckCircle, AlertCircle, Clock, History, Search, Film, X, Pause
} from "lucide-react";

interface VideoSegment { id: string; startTime: string; endTime: string; description: string; technique: string; tags: string[]; }
interface AnalysisRecord { id: string; url: string; productName: string; analyzedAt: string; progress: number; status: string; segments: VideoSegment[]; error?: string; }

const DEF = "请分析以下视频的拍摄手法：\n1. 镜头语言\n2. 光影运用\n3. 色彩搭配\n4. 构图方式\n5. 转场技巧\n6. 节奏控制\n7. 产品展示手法\n8. 可复用的拍摄公式";

function parseSeconds(t: string) { const [m, s] = t.split(":").map(Number); return (m || 0) * 60 + (s || 0); }

export default function CompetitorAnalysisPage() {
  const utils = trpc.useUtils();
  const { data: dbRecords } = trpc.analysis.list.useQuery();
  const createRecord = trpc.analysis.create.useMutation();
  const deleteRecord = trpc.analysis.delete.useMutation();

  const [tkLink, setTkLink] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [activeTab, setActiveTab] = useState("input");
  const [videoUrl, setVideoUrl] = useState("");
  const [inputMode, setInputMode] = useState<"link" | "local">("link");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [masterTime, setMasterTime] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const masterVideoRef = useRef<HTMLVideoElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!prompt) setPrompt(DEF); }, []);

  // Map DB → UI records
  const records: AnalysisRecord[] = (dbRecords || []).map((r) => ({
    id: r.id, url: r.url, productName: r.productName || `分析·${new Date(r.createdAt).toLocaleTimeString("zh-CN")}`,
    analyzedAt: r.createdAt.toString(), progress: r.progress, status: r.status,
    segments: r.result ? (() => { try { return JSON.parse(r.result); } catch { return []; } })() : [],
    error: r.error || undefined,
  }));

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith("video/")) { setErrorMsg("请上传视频文件 (MP4/MOV/WebM)"); return; }
    if (file.size > 500 * 1024 * 1024) { setErrorMsg("文件最大 500MB"); return; }
    setVideoFile(file);
    setLocalPreview(URL.createObjectURL(file));
    setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleVideoFile(f); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); };
  const handlePromptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; setPromptFile(f);
    const r = new FileReader(); r.onload = (ev) => { setPrompt(ev.target?.result as string || ""); }; r.readAsText(f);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定删除此分析记录？")) return;
    await deleteRecord.mutateAsync({ id });
    if (activeRecord?.id === id) { setActiveRecord(null); setActiveTab("input"); }
    utils.analysis.list.invalidate();
  };

  const handleSeek = (startTime: string) => {
    const sec = parseSeconds(startTime);
    setMasterTime(sec);
    if (masterVideoRef.current) { masterVideoRef.current.currentTime = sec; masterVideoRef.current.play().catch(() => {}); }
  };

  const handleAnalyze = async () => {
    setErrorMsg("");
    let videoSrc = tkLink.trim();

    if (inputMode === "local") {
      if (!videoFile) { setErrorMsg("请选择视频文件"); return; }
      setUploading(true);
      try {
        const fd = new FormData(); fd.append("video", videoFile);
        const uploadRes = await fetch("/api/upload/video", { method: "POST", body: fd });
        if (!uploadRes.ok) { const errData = await uploadRes.json().catch(() => ({})); throw new Error(errData.error || `上传失败 HTTP ${uploadRes.status}`); }
        const uploadData = await uploadRes.json();
        videoSrc = uploadData.url;
        setVideoUrl(videoSrc);
      } catch (err: unknown) {
        setErrorMsg(`上传失败: ${err instanceof Error ? err.message : String(err)}`);
        setUploading(false); return;
      }
      setUploading(false);
    } else {
      if (!videoSrc) { setErrorMsg("请输入视频链接"); return; }
      setVideoUrl(videoSrc);
    }

    setAnalyzing(true); setProgress(0); setStage("创建分析任务...");

    try {
      const record = await createRecord.mutateAsync({ url: videoSrc, prompt: prompt || undefined });
      const recordId = record.id;
      setActiveTab("result");

      // Poll progress while API runs
      setStage("正在调用 Gemini 3.1 Pro 分析视频...");
      setProgress(15);
      const poll = setInterval(async () => {
        try {
          const r = await utils.analysis.byId.fetch({ id: recordId });
          if (r) {
            setProgress(Math.min((r.progress || 0), 90));
            if (r.error) { setStage(`分析失败: ${r.error}`); setProgress(0); }
          }
        } catch { /* silent */ }
      }, 2000);

      const res = await fetch("/api/competitor/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: videoSrc, prompt: prompt || undefined, recordId }),
      });
      clearInterval(poll);

      if (!res.ok) { const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(err.error || "分析失败"); }
      const data = await res.json();
      setProgress(100); setStage(`分析完成 · ${data.model || "Gemini 3.1 Pro"}`);

      const segments: VideoSegment[] = (data.segments || []).map((s: Omit<VideoSegment, "id"> & { id?: string }, i: number) => ({ ...s, id: s.id || String(i + 1) }));
      setActiveRecord({ id: recordId, url: videoSrc, productName: record.productName, analyzedAt: new Date().toISOString(), progress: 100, status: "completed", segments });
      utils.analysis.list.invalidate();
    } catch (err: unknown) {
      setErrorMsg(`分析失败: ${err instanceof Error ? err.message : String(err)}`);
      setStage(`失败: ${err instanceof Error ? err.message : String(err)}`);
      setProgress(0);
    } finally { setAnalyzing(false); }
  };

  const viewRecord = (r: AnalysisRecord) => { setActiveRecord(r); setVideoUrl(r.url); setActiveTab("result"); };

  const isLocal = (url: string) => url.startsWith("/uploads/") || url.startsWith("blob:");
  const isPlayable = (url: string) => /\.(mp4|webm|mov|avi|mkv)($|\?)/i.test(url);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold">竞品调研</h1>
        <p className="text-sm text-zinc-400 mt-1">上传视频/链接 → Gemini 3.1 Pro 分析拍摄手法 → 逐片段查看</p>
      </div>

      <Tabs tabs={[{ id: "input", label: "新建分析" }, { id: "history", label: `分析列表${records.length ? ` (${records.length})` : ""}`, icon: History }, { id: "result", label: "分析结果", icon: Eye }]} active={activeTab} onChange={setActiveTab} />

      {/* ═══ Input Tab ═══ */}
      {activeTab === "input" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          {/* Toggle */}
          <div className="flex items-center gap-2">
            {([["link", "链接"], ["local", "本地视频"]] as const).map(([m, l]) => (
              <button key={m} onClick={() => setInputMode(m)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${inputMode === m ? "bg-violet-500/10 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>
                {m === "link" ? <LinkIcon className="w-4 h-4 inline mr-1.5" /> : <Upload className="w-4 h-4 inline mr-1.5" />}{l}
              </button>
            ))}
          </div>

          {/* Link */}
          {inputMode === "link" && (
            <input type="url" value={tkLink} onChange={(e) => setTkLink(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/123456..."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} />
          )}

          {/* Local Upload */}
          {inputMode === "local" && (
            <div>
              <input type="file" ref={fileUploadRef} accept="video/*" onChange={handleFileSelect} className="hidden" />
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileUploadRef.current?.click()}
                className={`rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center ${dragOver ? "border-violet-400 bg-violet-500/10" : videoFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/50"}`}>
                {videoFile ? (
                  <div className="space-y-2">
                    {localPreview && <video src={localPreview} controls className="max-h-48 mx-auto rounded-lg" />}
                    <p className="text-sm font-medium text-emerald-400">{videoFile.name} <span className="text-xs text-zinc-500">({(videoFile.size / 1024 / 1024).toFixed(1)}MB)</span></p>
                    <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); setLocalPreview(""); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-2"><Upload className="w-10 h-10 text-zinc-500 mx-auto" /><p className="text-sm text-zinc-400">拖拽视频或点击上传</p><p className="text-xs text-zinc-600">MP4 / MOV / WebM · 最大 500MB</p></div>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">分析提示词</label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".txt,.md" onChange={handlePromptUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="text-xs text-zinc-500 hover:text-zinc-300"><Upload className="w-3 h-3 inline mr-1" />上传</button>
                {promptFile && <Badge variant="info" className="text-[10px]"><FileText className="w-3 h-3 mr-1" />{promptFile.name}<button onClick={() => setPromptFile(null)} className="ml-1 hover:text-red-400"><Trash2 className="w-3 h-3" /></button></Badge>}
                <button onClick={() => setPrompt(DEF)} className="text-xs text-zinc-500 hover:text-violet-400">默认</button>
              </div>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:border-violet-500/50 transition-colors resize-none" spellCheck={false} />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-400 flex-1">{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Progress */}
          {analyzing && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 text-violet-400 animate-spin" />{stage}</span>
                <span className="text-violet-400 font-mono font-bold">{progress}%</span>
              </div>
              <Progress value={progress} size="lg" />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleAnalyze} loading={analyzing || uploading} disabled={inputMode === "link" ? !tkLink.trim() : !videoFile}>
              <Search className="w-4 h-4" />{uploading ? "上传中..." : analyzing ? "分析中..." : "开始分析"}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ History Tab ═══ */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800"><History className="w-10 h-10 text-zinc-600 mx-auto mb-2" /><p className="text-zinc-500">暂无记录</p></div>
          ) : (
            records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all group">
                <button onClick={() => viewRecord(r)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                  {r.status === "completed" ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : r.status === "failed" ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> : r.status === "analyzing" ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" /> : <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.url}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{new Date(r.analyzedAt).toLocaleString("zh-CN")} · {r.segments.length}片段{r.error ? ` · ${r.error.slice(0, 50)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.status === "analyzing" && <Progress value={r.progress} size="sm" className="w-16" />}
                    <Badge variant={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "warning"} className="text-[10px]">{r.status === "completed" ? "完成" : r.status === "failed" ? "失败" : "分析中"}</Badge>
                  </div>
                </button>
                <button onClick={(e) => handleDelete(r.id, e)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0" title="删除"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Result Tab ═══ */}
      {activeTab === "result" && activeRecord && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("history")} className="text-sm text-zinc-500 hover:text-zinc-300">← 返回列表</button>
            <span className="text-zinc-700">|</span>
            <button onClick={() => handleDelete(activeRecord.id, { stopPropagation: () => {} } as React.MouseEvent)} className="text-sm text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5 inline mr-1" />删除</button>
          </div>

          {/* Error Banner */}
          {activeRecord.status === "failed" && activeRecord.error && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">分析失败</p>
                <p className="text-xs text-red-400/70 mt-1">{activeRecord.error}</p>
              </div>
            </div>
          )}

          {/* Master Video Player */}
          <div className="rounded-2xl border border-zinc-800 bg-black overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-zinc-950">
              {videoUrl && (isLocal(videoUrl) || isPlayable(videoUrl)) ? (
                <video ref={masterVideoRef} key={videoUrl} className="w-full h-full" controls playsInline preload="metadata"
                  onTimeUpdate={(e) => setMasterTime(Math.floor(e.currentTarget.currentTime))}
                  onLoadedMetadata={() => { if (masterVideoRef.current && masterTime > 0) { masterVideoRef.current.currentTime = masterTime; } }}>
                  <source src={videoUrl} type={videoUrl.endsWith(".webm") ? "video/webm" : videoUrl.endsWith(".mov") ? "video/quicktime" : "video/mp4"} />
                </video>
              ) : videoUrl ? (
                <div className="text-center space-y-3 p-8">
                  <Play className="w-12 h-12 text-zinc-500 mx-auto" />
                  <a href={videoUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors">
                    <Play className="w-4 h-4" />打开原链接查看
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-2"><Film className="w-10 h-10 text-zinc-700 mx-auto" /><p className="text-zinc-500 text-sm">视频预览</p></div>
              )}
            </div>
            {(isLocal(videoUrl) || isPlayable(videoUrl)) && (
              <div className="flex items-center gap-3 px-3 py-2 border-t border-zinc-800 bg-zinc-900/50">
                <span className="text-xs text-zinc-500 font-mono">{String(Math.floor(masterTime / 60)).padStart(2, "0")}:{String(masterTime % 60).padStart(2, "0")}</span>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full"><div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${(masterTime / 30) * 100}%` }} /></div>
                <button onClick={() => masterVideoRef.current?.play()} className="p-1 hover:text-zinc-300 text-zinc-500"><Play className="w-3.5 h-3.5" /></button>
                <button onClick={() => masterVideoRef.current?.pause()} className="p-1 hover:text-zinc-300 text-zinc-500"><Pause className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div><h2 className="font-semibold">{activeRecord.productName}</h2><p className="text-xs text-zinc-500 mt-0.5">{new Date(activeRecord.analyzedAt).toLocaleString("zh-CN")}</p></div>
            <Badge variant={activeRecord.status === "completed" ? "success" : "warning"}>{activeRecord.status === "completed" ? "完成" : activeRecord.status === "failed" ? "失败" : "分析中"} · {activeRecord.segments.length} 片段</Badge>
          </div>

          {/* Segments */}
          {activeRecord.segments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Film className="w-5 h-5 text-violet-400" />逐片段分析</h3>
              {activeRecord.segments.map((seg, idx) => (
                <div key={seg.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-violet-400">#{idx + 1}</span>
                      <button onClick={() => handleSeek(seg.startTime)} className="font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                        <Play className="w-3 h-3" />{seg.startTime} → {seg.endTime}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">{seg.tags.map((tag) => <Badge key={tag} variant="violet" className="text-[10px]">{tag}</Badge>)}</div>
                  </div>
                  <p className="text-sm text-zinc-300">{seg.description}</p>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <span className="text-xs text-violet-400 font-medium">拍摄手法</span>
                    <p className="text-sm text-zinc-400 mt-0.5">{seg.technique}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button><Download className="w-4 h-4" />导出报告</Button>
                <Button variant="secondary">复制到故事板</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
