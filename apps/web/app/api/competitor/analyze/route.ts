import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lingkeGeminiChat } from "@platform/ai";
import { db } from "@platform/database";

const DEFAULT_PROMPT = `请分析以下视频的拍摄手法，按以下维度逐一解析：
1. 镜头语言（景别、运镜、角度）
2. 光影运用（光源、光位、光比）
3. 色彩搭配（主色调、饱和度、对比度）
4. 构图方式（三分法、引导线、留白）
5. 转场技巧（硬切、淡入淡出、滑动）
6. 节奏控制（镜头时长、快慢节奏）
7. 产品展示手法（时机、功能演示、特写）
8. 可复用的拍摄公式（拍摄模板、分镜脚本）

请对每个维度给出具体的时间戳和画面描述。`;

const SYSTEM_PROMPT = `你是一个专业的视频拍摄手法分析师。你需要分析视频内容并按以下 JSON 格式返回结果（只返回 JSON，不要其他文字）：

{
  "segments": [
    {
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "description": "画面描述（中文，简洁）",
      "technique": "拍摄手法分析（中文，包含镜头、光影、构图等技术细节）",
      "tags": ["标签1", "标签2"]
    }
  ]
}

每个视频分析出4-8个关键片段，标签用简短关键词。`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoUrl, prompt, recordId } = await req.json();
  if (!videoUrl || !recordId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userPrompt = prompt || DEFAULT_PROMPT;

  try {
    // Update record to show real AI analysis is happening
    await db.analysisRecord.update({
      where: { id: recordId },
      data: { status: "analyzing", progress: 40 },
    });

    // Call 灵客 Gemini 3.1 Pro for video analysis (multimodal, best for video understanding)
    const result = await lingkeGeminiChat(
      [
        { role: "user", content: `${SYSTEM_PROMPT}\n\n视频URL: ${videoUrl}\n\n分析要求: ${userPrompt}` },
      ],
      { maxTokens: 4096, temperature: 0.4 }
    );

    // Parse the JSON response
    let segments;
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result.text];
      const jsonStr = jsonMatch[1]!.trim();
      const parsed = JSON.parse(jsonStr);
      segments = parsed.segments || [];
    } catch {
      // Fallback: generate structured segments from raw text
      segments = [
        { startTime: "00:00", endTime: "00:05", description: "AI 分析结果", technique: result.text.slice(0, 200), tags: ["AI分析"] },
      ];
    }

    // Save results
    await db.analysisRecord.update({
      where: { id: recordId },
      data: {
        status: "completed",
        progress: 100,
        result: JSON.stringify(segments),
      },
    });

    return NextResponse.json({ success: true, segments, model: "Gemini 3.1 Pro (灵客)" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Analysis error:", msg);

    // Update record with error
    await db.analysisRecord.update({
      where: { id: recordId },
      data: { status: "failed", error: msg },
    });

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
