"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus, Search, ArrowRight, FolderOpen } from "lucide-react";

export default function ProjectsPage() {
  const { data: projects, isLoading } = trpc.project.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = projects?.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">项目</h1>
          <p className="text-sm text-zinc-400 mt-1">管理所有视频营销项目</p>
        </div>
        <Link href="/projects/new"><Button variant="primary"><Plus className="w-4 h-4" />新建项目</Button></Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索项目..."
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <FolderOpen className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-zinc-500">{search ? "没有匹配的项目" : "还没有项目"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group block p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-violet-500/20 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold group-hover:text-violet-400 transition-colors">{project.productName}</h3>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              {project.description && <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{project.description}</p>}
              <div className="flex items-center gap-3">
                <Badge variant={project.status === "active" ? "success" : "default"}>
                  {project.status === "active" ? "进行中" : "草稿"}
                </Badge>
                <span className="text-xs text-zinc-600">{project._count.tasks} 个任务</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
