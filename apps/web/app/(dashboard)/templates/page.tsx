"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, Copy, ArrowRight } from "lucide-react";

const mockTemplates = [
  { id: "1", name: "电商产品展示", desc: "30秒标准电商视频模板", usageCount: 12 },
  { id: "2", name: "品牌故事", desc: "60秒品牌形象片模板", usageCount: 5 },
  { id: "3", name: "功能对比", desc: "竞品对比表格+动画", usageCount: 8 },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模板</h1>
          <p className="text-sm text-zinc-400 mt-1">保存配置为模板，一键复刻到新项目</p>
        </div>
        <Button variant="secondary"><Plus className="w-4 h-4" />新建模板</Button>
      </div>

      {mockTemplates.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-zinc-500">还没有模板 · 从已完成的流水线保存</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTemplates.map((t) => (
            <div key={t.id} className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-violet-500/20 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Layers className="w-5 h-5 text-violet-400" />
                </div>
                <Badge variant="default">{t.usageCount} 次使用</Badge>
              </div>
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{t.desc}</p>
              <button className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                <Copy className="w-3.5 h-3.5" />
                一键使用
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
