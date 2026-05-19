"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard, Search, Film, Brain, Scissors, Copy, FolderOpen,
  Layers, Wand2, LogOut, Sun, Moon, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/competitor-analysis", label: "竞品调研", icon: Search },
  { href: "/storyboard", label: "故事板生成", icon: Film },
  { href: "/models", label: "大模型列表", icon: Brain },
  { href: "/auto-edit", label: "自动剪辑配音", icon: Scissors },
  { href: "/one-click-clone", label: "一键复刻", icon: Copy },
];

const secondaryNav = [
  { href: "/projects", label: "项目管理", icon: FolderOpen },
  { href: "/templates", label: "模板库", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">Video<span className="text-violet-400">Forge</span></span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-auto">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const active = pathname.startsWith(item.href) && item.href !== "/" ? true : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? "bg-violet-500/10 text-violet-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </div>

        <div className="my-3 border-t border-zinc-800" />

        <div className="space-y-1">
          {secondaryNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? "bg-violet-500/10 text-violet-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-zinc-800 space-y-1">
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && (theme === "dark" ? "亮色模式" : "暗色模式")}
        </button>
        <button
          onClick={() => signOut()}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && (session?.user?.name || "退出")}
        </button>
      </div>
    </aside>
  );
}
