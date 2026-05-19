import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lingkeVideoGeneration } from "@platform/ai";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

const execFileP = promisify(execFile);
const DREAMINA_BIN = path.join(os.homedir(), "bin", "dreamina.exe");

const ALLOWED_DREAMINA_MODELS = ["seedance2.0", "seedance2.0fast"] as const;

async function dreaminaGenerate(prompt: string, imageUrls: string[], modelVersion: string): Promise<string> {
  // Block VIP models
  if (!ALLOWED_DREAMINA_MODELS.includes(modelVersion as typeof ALLOWED_DREAMINA_MODELS[number])) {
    throw new Error(`禁止使用 VIP 模型: ${modelVersion}。仅允许 seedance2.0 / seedance2.0fast`);
  }

  // Download images to temp dir (dreamina needs local files)
  const tmpDir = path.join(os.tmpdir(), "dreamina_gen");
  await mkdir(tmpDir, { recursive: true });

  const localPaths: string[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]!;
    const ext = url.endsWith(".png") ? ".png" : ".jpg";
    const localPath = path.join(tmpDir, `img_${i}${ext}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载参考图失败: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(localPath, buf);
    localPaths.push(localPath);
  }

  const bestPrompt = prompt?.trim() || "流畅运镜，画面连贯自然，镜头缓慢推进";

  // Build multimodal2video args (Seedance 2.0 family)
  const args = ["multimodal2video", "--prompt", bestPrompt, "--duration", "8", "--model_version", modelVersion, "--poll", "300"];
  for (const lp of localPaths) {
    args.push("--image", lp);
  }

  const { stdout } = await execFileP(DREAMINA_BIN, args, {
    timeout: 360_000, maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, HOME: os.homedir(), USERPROFILE: os.homedir() },
  });

  const result = JSON.parse(stdout);
  if (result.gen_status !== "success") {
    throw new Error(`即梦生成失败: ${result.fail_reason || "未知错误"}`);
  }
  const videoUrl = result.result_json?.videos?.[0]?.video_url;
  if (!videoUrl) throw new Error("即梦未返回视频URL");
  return videoUrl;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, imageUrls, model } = await req.json();
  if (!imageUrls?.length) return NextResponse.json({ error: "至少需要一张参考图片" }, { status: 400 });

  try {
    // dreamina CLI via multimodal2video (Seedance 2.0 family)
    if (model === "seedance2.0" || model === "seedance2.0fast") {
      const videoUrl = await dreaminaGenerate(prompt, imageUrls, model);

      return NextResponse.json({
        success: true,
        videoUrl,
        model: `即梦 CLI (${model})`,
      });
    }

    const result = await lingkeVideoGeneration(
      prompt?.trim() || "根据参考图生成连贯的视频短片，流畅运镜，保持风格一致",
      imageUrls.slice(0, 9),
      { duration: "auto", resolution: "720p", model }
    );

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      taskId: result.taskId,
      model: "灵客 · 即梦",
      cost: result.cost,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Auto-edit generation error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
