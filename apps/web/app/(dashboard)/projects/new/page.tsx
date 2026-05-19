"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = trpc.project.create.useMutation();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!productName.trim()) return;
    const project = await createProject.mutateAsync({
      productName: productName.trim(),
      description: description.trim() || undefined,
    });
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回
      </Link>

      <div>
        <h1 className="text-2xl font-bold">新建项目</h1>
        <p className="text-sm text-zinc-400 mt-1">创建一个新的视频营销项目</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">产品名称</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="例如：智能手表 X1 Pro"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">描述（可选）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简单描述你的产品和营销目标..."
            className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/projects"><Button variant="secondary">取消</Button></Link>
          <Button onClick={handleCreate} disabled={!productName.trim() || createProject.isPending} loading={createProject.isPending}>
            <Sparkles className="w-4 h-4" />创建项目
          </Button>
        </div>
      </div>
    </div>
  );
}
