"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Wand2, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { password, redirect: false });
    if (result?.error) { setError("密码错误"); setLoading(false); }
    else window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto px-4 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/25 mb-6">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Video<span className="text-violet-400">Forge</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">AI 驱动的视频营销内容生产平台</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">访问密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              autoFocus
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? "验证中..." : "进入平台"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-8">VideoForge v0.1 · AI Video Marketing Platform</p>
      </div>
    </div>
  );
}
