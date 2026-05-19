"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, CheckCircle, Clock, FolderOpen, TrendingUp, ArrowRight, Zap } from "lucide-react";

export default function DashboardPage() {
  const { data: projects } = trpc.project.list.useQuery();
  const { data: recentTasks } = trpc.pipeline.history.useQuery();

  const stats = {
    total: projects?.length || 0,
    running: recentTasks?.filter((t: { status: string }) => t.status === "running").length || 0,
    completed: recentTasks?.filter((t: { status: string }) => t.status === "completed").length || 0,
    pending: recentTasks?.filter((t: { status: string }) => t.status === "pending").length || 0,
  };

  const kpis = [
    { label: "全部项目", value: stats.total, icon: FolderOpen, color: "text-zinc-400" },
    { label: "运行中", value: stats.running, icon: Play, color: "text-amber-400" },
    { label: "已完成", value: stats.completed, icon: CheckCircle, color: "text-emerald-400" },
    { label: "待处理", value: stats.pending, icon: Clock, color: "text-blue-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">概览</h1>
          <p className="text-sm text-zinc-400 mt-1">AI 视频营销内容生产平台</p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary" size="md"><Plus className="w-4 h-4" />新建项目</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <kpi.icon className={`w-5 h-5 ${kpi.color} opacity-60`} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/5 to-transparent group-hover:from-violet-500/10 transition-all" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "完整流水线", desc: "竞品分析 → 分镜 → 脚本 → 视频生成", icon: Zap, href: "/projects" },
          { label: "竞品分析", desc: "快速生成竞品分析报告", icon: TrendingUp, href: "/projects" },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-violet-500/20 transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <action.icon className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent Tasks */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">最近任务</h2>
        {!recentTasks?.length ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800">
            <p className="text-zinc-500 text-sm">还没有任务 · 新建项目开始你的第一条视频</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks?.slice(0, 8).map((task: { id: string; projectId: string; type: string; status: string; progress: number; createdAt: string; project: { productName: string } }) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}/pipeline?id=${task.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{task.project.productName}</span>
                    <Badge variant={task.status === "completed" ? "success" : task.status === "running" ? "warning" : task.status === "failed" ? "danger" : "default"}>
                      {task.status === "completed" ? "已完成" : task.status === "running" ? "运行中" : task.status === "failed" ? "失败" : "待处理"}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">{task.type === "full_pipeline" ? "完整流水线" : task.type === "competitor_analysis" ? "竞品分析" : "模板复刻"} · {new Date(task.createdAt).toLocaleDateString("zh-CN")}</p>
                </div>
                <div className="w-24">
                  <Progress value={task.progress} size="sm" variant={task.status === "completed" ? "success" : "primary"} />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
