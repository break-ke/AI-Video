"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, ImageIcon, Copy, Play, Download, RefreshCw, X } from "lucide-react";

export default function OneClickClonePage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetVideo, setTargetVideo] = useState<string>("");
  const [cloning, setCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSourceImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleClone = async () => {
    if (!sourceImage || !targetVideo.trim()) return;
    setCloning(true);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(timer); return 100; }
        return p + Math.random() * 10;
      });
    }, 500);

    // TODO: Call 即梦 图生视频 / Kling Motion Control to replace product
    setTimeout(() => { clearInterval(timer); setProgress(100); setCloning(false); setResultUrl("mock-result-url"); }, 6000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold">一键复刻</h1>
        <p className="text-sm text-zinc-400 mt-1">上传你的产品图片，替换参考视频中的商品，保持拍摄手法不变</p>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Image */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            你的产品图片
          </h3>
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => imgRef.current?.click()}
            className="w-full aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/30 transition-all flex items-center justify-center"
          >
            {sourceImage ? (
              <div className="relative w-full h-full">
                <img src={sourceImage} alt="产品" className="w-full h-full object-cover rounded-xl" />
                <button onClick={(e) => { e.stopPropagation(); setSourceImage(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Upload className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-500">上传产品图片</p>
                <p className="text-xs text-zinc-600">PNG / JPG / WebP</p>
              </div>
            )}
          </button>
        </div>

        {/* Target Video */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-violet-400" />
            参考视频链接
          </h3>
          <div className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <div className="text-center space-y-3 p-4">
              <Copy className="w-8 h-8 text-zinc-600 mx-auto" />
              <input
                type="url"
                value={targetVideo}
                onChange={(e) => setTargetVideo(e.target.value)}
                placeholder="粘贴参考视频链接（TikTok/抖音等）"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-center placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <p className="text-xs text-zinc-600">视频内容保持不变，仅替换产品</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clone Button */}
      <Button onClick={handleClone} loading={cloning} disabled={!sourceImage || !targetVideo.trim()} size="lg" className="w-full">
        <Copy className="w-4 h-4" />{cloning ? "复刻中..." : "开始复刻"}
      </Button>

      {/* Progress */}
      {cloning && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">即梦 · 图生视频 · 产品替换中...</span>
            <span className="text-violet-400 font-mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} size="lg" />
        </div>
      )}

      {/* Result */}
      {resultUrl && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">复刻完成</Badge>
            <span className="text-sm text-emerald-400">产品已替换，拍摄手法保持一致</span>
          </div>
          <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <Play className="w-6 h-6 text-emerald-400 ml-1" />
              </div>
              <p className="text-zinc-500 text-sm">点击播放复刻结果</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="success"><Download className="w-4 h-4" />下载视频</Button>
            <Button variant="secondary"><RefreshCw className="w-4 h-4" />重新复刻</Button>
          </div>
        </div>
      )}
    </div>
  );
}
