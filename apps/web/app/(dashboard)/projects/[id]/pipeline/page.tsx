"use client";
import { useParams, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PIPELINE_STAGES } from "@platform/shared";
import { CheckCircle, Loader2, Clock, AlertCircle, ThumbsUp, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

const stageMeta: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  completed: { icon: CheckCircle, label: "已完成", color: "text-emerald-400" },
  running: { icon: Loader2, label: "运行中", color: "text-amber-400" },
  waiting_feedback: { icon: Clock, label: "等待反馈", color: "text-blue-400" },
  failed: { icon: AlertCircle, label: "失败", color: "text-red-400" },
  pending: { icon: Clock, label: "待处理", color: "text-zinc-600" },
};

const badgeVariant = (s: string) => {
  if (s === "completed") return "success" as const;
  if (s === "running") return "warning" as const;
  if (s === "failed") return "danger" as const;
  if (s === "waiting_feedback") return "info" as const;
  return "default" as const;
};

export default function PipelinePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");
  const utils = trpc.useUtils();

  const { data: task } = trpc.pipeline.byId.useQuery(
    { id: taskId || "" },
    { enabled: !!taskId, refetchInterval: 3000 }
  );
  const submitFeedback = trpc.pipeline.submitFeedback.useMutation();

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  if (!taskId || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">加载流水线...</p>
        </div>
      </div>
    );
  }

  const handleSubmitFeedback = async () => {
    if (!comment.trim() && !rating) return;
    await submitFeedback.mutateAsync({
      taskId: task.id,
      stage: task.currentStage || "storyboard",
      rating: rating ?? undefined,
      comment: comment || undefined,
    });
    setComment("");
    setRating(null);
    utils.pipeline.byId.invalidate({ id: task.id });
  };

  const typeLabel = task.type === "full_pipeline" ? "完整流水线" : task.type === "competitor_analysis" ? "竞品分析" : "模板复刻";

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回项目
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">流水线进度</h1>
          <Badge variant={badgeVariant(task.status)}>
            {task.status === "completed" ? "已完成" : task.status === "running" ? "运行中" : task.status === "waiting_feedback" ? "等待反馈" : task.status === "failed" ? "失败" : "待处理"}
          </Badge>
        </div>
        <p className="text-sm text-zinc-400">{typeLabel} · 开始于 {new Date(task.createdAt).toLocaleString("zh-CN")}</p>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">总进度</span>
          <span className="text-sm font-mono font-bold text-violet-400">{task.progress}%</span>
        </div>
        <Progress value={task.progress} size="lg" variant={task.status === "completed" ? "success" : "primary"} />
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {PIPELINE_STAGES.map((stage, idx) => {
          const current = task.stages?.find((s: { stageType: string }) => s.stageType === stage.key);
          const status: string = current?.status || "pending";
          const isCurrent = task.currentStage === stage.key;
          const meta = stageMeta[status] ?? stageMeta.pending;
          const Icon = meta!.icon;

          return (
            <div key={stage.key} className="relative flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  status === "completed" ? "border-emerald-500 bg-emerald-500/10" :
                  status === "running" ? "border-amber-500 bg-amber-500/10" :
                  status === "failed" ? "border-red-500 bg-red-500/10" :
                  "border-zinc-700 bg-zinc-900"
                } ${isCurrent ? "ring-2 ring-violet-500/30 animate-pulse-glow" : ""}`}>
                  <Icon className={`w-4 h-4 ${meta!.color} ${status === "running" ? "animate-spin" : ""}`} />
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-0.5 h-10 -mb-1 transition-colors duration-300 ${status === "completed" ? "bg-emerald-500/30" : "bg-zinc-800"}`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-5 ${status === "pending" ? "opacity-50" : ""}`}>
                <div className={`p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent ? "border-violet-500/30 bg-violet-500/5" :
                  status === "completed" ? "border-zinc-800 bg-zinc-900/30" :
                  "border-transparent bg-transparent"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${status !== "pending" ? "text-zinc-100" : "text-zinc-500"}`}>
                        {stage.label}
                      </span>
                      {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium">进行中</span>}
                    </div>
                    {current?.completedAt && (
                      <span className="text-xs text-zinc-500">{new Date(current.completedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>
                  {current?.error && <p className="text-xs text-red-400 mt-1.5">{current.error}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Panel */}
      {task.status === "waiting_feedback" && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-blue-400">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold">等待您的反馈</h3>
          </div>

          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  rating && star <= rating
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            ))}
            {rating && <span className="text-sm text-zinc-400 self-center">{rating}/5</span>}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="描述你的反馈意见..."
            className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
          />

          <div className="flex gap-3">
            <Button onClick={handleSubmitFeedback} disabled={(!comment.trim() && !rating) || submitFeedback.isPending} loading={submitFeedback.isPending}>
              提交反馈
            </Button>
            <Button variant="secondary" onClick={() => submitFeedback.mutateAsync({ taskId: task.id, stage: task.currentStage || "storyboard" }).then(() => utils.pipeline.byId.invalidate({ id: task.id }))}>
              确认通过，继续
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
