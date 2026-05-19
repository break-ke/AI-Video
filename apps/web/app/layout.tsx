import type { Metadata } from "next";
import { Providers } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { SessionWrapper } from "./session-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "VideoForge — AI 视频营销平台",
  description: "竞品分析 → 分镜 → 脚本 → 视频生成 → 一键导出",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <SessionWrapper>
            <Providers>{children}</Providers>
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
