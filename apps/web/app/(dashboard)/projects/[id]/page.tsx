"use client";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { ArrowLeft, Play, BarChart3, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { data: project } = trpc.project.byId.useQuery({ id });
  const startPipeline = trpc.project.startPipeline.useMutation();
  const [starting, setStarting] = useState<string | null>(null);

  if (!project) {
    return <div className="flex items-center justify-center h-full text-zinc-400">加载中...</div>;
  }

  const handleStart = async (type: "full_pipeline" | "competitor_analysis") => {
    setStarting(type);
    const task = await startPipeline.mutateAsync({ projectId: id, type });
    setStarting(null);
    window.location.href = `/projects/${id}/pipeline?id=${task.id}`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="w-3 h-3 text-amber-400" />;
      case "completed": return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case "failed": return <AlertCircle className="w-3 h-3 text-red-400" />;
      case "waiting_feedback": return <Clock className="w-3 h-3 text-blue-400" />;
      default: return <Clock className="w-3 h-3 text-zinc-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-8 animate-slide-up">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回项目列表
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.productName}</h1>
          {project.description && <p className="text-zinc-400 mt-1">{project.description}</p>}
        </div>
        <Badge variant={project.status === "active" ? "success" : "default"}>
          {project.status === "active" ? "进行中" : "草稿"}
        </Badge>
      </div>

      {/* Launch Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          disabled={!!starting}
          onClick={() => handleStart("full_pipeline")}
          className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-violet-500/20 disabled:opacity-50 transition-all duration-200 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
              <Play className="w-5 h-5 text-violet-400" />
            </div>
            {starting === "full_pipeline" && <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
          </div>
          <h3 className="font-semibold mb-1">完整流水线</h3>
          <p className="text-sm text-zinc-500">竞品分析 → 分镜 → 脚本 → 视频生成 → 一键导出</p>
        </button>

        <button
          disabled={!!starting}
          onClick={() => handleStart("competitor_analysis")}
          className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-violet-500/20 disabled:opacity-50 transition-all duration-200 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold mb-1">竞品分析</h3>
          <p className="text-sm text-zinc-500">快速生成竞品分析报告</p>
        </button>
      </div>

      {/* Task History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">任务历史</h2>
        {!project.tasks.length ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">还没有任务</p>
          </div>
        ) : (
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${id}/pipeline?id=${task.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all group"
              >
                {statusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {task.type === "full_pipeline" ? "完整流水线" : task.type === "competitor_analysis" ? "竞品分析" : "模板复刻"}
                    </span>
                    <Badge variant={task.status === "completed" ? "success" : task.status === "running" ? "warning" : task.status === "failed" ? "danger" : task.status === "waiting_feedback" ? "info" : "default"}>
                      {task.status === "completed" ? "已完成" : task.status === "running" ? "运行中" : task.status === "failed" ? "失败" : task.status === "waiting_feedback" ? "等待反馈" : "待处理"}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">{new Date(task.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <Progress value={task.progress} size="sm" variant={task.status === "completed" ? "success" : "primary"} className="w-20" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
