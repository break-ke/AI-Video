"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { useState } from "react";
import { ArrowLeft, Wand2, RotateCcw, Check, Copy, History } from "lucide-react";

export default function ScriptPage() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState(
    "[开场 · 3秒]\n画面：产品从黑暗中浮现，光线扫过机身\n配音：这一次，我们重新定义了续航\n\n[痛点展示 · 8秒]\n画面：快速切换日常充电场景\n配音：每天充电？不，那是过去式\n\n[卖点展示 · 15秒]\n画面：产品特写 + 电池续航数字动画\n配音：48小时超长续航，让电量焦虑成为历史\n\n[场景展示 · 10秒]\n画面：户外、出差、游戏三个场景快速切换\n配音：无论何时何地，它都在你身边\n\n[结尾CTA · 4秒]\n画面：产品 + Logo + 价格\n配音：立即购买，开启无忧续航新体验"
  );
  const [feedback, setFeedback] = useState("");
  const [version, setVersion] = useState(1);
  const [activeTab, setActiveTab] = useState("editor");
  const [historyStack, setHistoryStack] = useState<string[]>([script]);

  const handleIterate = () => {
    setHistoryStack((prev) => [...prev, script]);
    setScript(script + "\n\n[AI 优化建议]\n- 开场可以更震撼\n- 痛点多强调数据对比");
    setVersion((v) => v + 1);
  };

  const handleUndo = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1]!;
      setHistoryStack((s) => s.slice(0, -1));
      setScript(prev);
      setVersion((v) => v - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />返回项目
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">脚本编辑器</h1>
            <Badge variant="violet">v{version}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleUndo} disabled={historyStack.length === 0}>
            <RotateCcw className="w-4 h-4" />撤销
          </Button>
          <Button variant="secondary" size="sm"><Copy className="w-4 h-4" />复制</Button>
          <Button size="sm" onClick={handleIterate}><Wand2 className="w-4 h-4" />AI 优化</Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "editor", label: "编辑器" },
          { id: "history", label: "版本历史", icon: History },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Script Editor */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-xs text-zinc-600 ml-2">script_v{version}.txt</span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-[500px] p-6 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none text-zinc-200 placeholder:text-zinc-600"
              spellCheck={false}
            />
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-violet-400" />
              AI 优化建议
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="告诉 AI 如何改进脚本...&#10;例如：语气更活泼一点、缩短到 30 秒、增加幽默元素"
              className="w-full h-32 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleIterate}><Wand2 className="w-3 h-3" />生成新版本</Button>
              <Button variant="secondary" size="sm"><Check className="w-3 h-3" />确认</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <h3 className="font-semibold text-sm">脚本统计</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "字数", value: script.length },
                { label: "预估时长", value: `${Math.round(script.length / 15)}秒` },
                { label: "版本数", value: version },
                { label: "迭代数", value: historyStack.length },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <p className="text-xs text-zinc-500">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
