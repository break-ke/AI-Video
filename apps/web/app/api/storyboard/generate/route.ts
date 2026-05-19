import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lingkeGPTChat, lingkeVisionAnalysis, lingkeImageGeneration } from "@platform/ai";
import { db } from "@platform/database";

const ENHANCE_PROMPT = `你是一个专业的分镜画面设计专家。请将用户的分镜描述扩展为详细的图片生成提示词，包含：
1. 构图方式（三分法、引导线、留白等）
2. 光影方案（光源方向、光比、氛围）
3. 色彩搭配（主色调、饱和度、对比度）
4. 景别与角度（特写/中景/远景，平视/俯拍/仰拍）
5. 风格参考（电影感、极简、科技感等）

输出格式：直接输出优化后的英文图片生成提示词（用于AI图片生成），然后另起一行输出"---"，再另起一行输出中文画面描述。`;

const VISION_ANALYSIS_PROMPT = `请分析这张参考图片的视觉特征：构图方式、光影运用、色彩搭配、景别角度、整体风格。用中文简洁回答。`;

const GPT_MODEL = "gpt-5.5-high";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, referenceImageBase64, recordId, model } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  try {
    if (recordId) {
      await db.storyboardScene.update({
        where: { id: recordId },
        data: { status: "generating" },
      });
    }

    // Build the GPT-5.5 input message
    let userMessage: string;

    if (referenceImageBase64) {
      // Step 1: Analyze reference image with GPT-5.5 vision
      const visionResult = await lingkeVisionAnalysis(VISION_ANALYSIS_PROMPT, referenceImageBase64, GPT_MODEL);
      userMessage = `参考图片分析结果：${visionResult}\n\n用户需求：${prompt}\n\n请基于以上信息生成图片提示词。`;
    } else {
      userMessage = prompt;
    }

    // Step 2: Enhance prompt with GPT-5.5
    const enhanced = await lingkeGPTChat(
      [{ role: "user", content: `${ENHANCE_PROMPT}\n\n${userMessage}` }],
      { maxTokens: 1024, temperature: 0.7 }
    );
    const parts = enhanced.text.split("---");
    const enhancedPrompt = (parts[0] || enhanced.text).trim();
    const sceneDescription = (parts[1] || prompt).trim();

    // Step 3: Generate image via 灵客 GPT Image 2 (async submit + poll)
    let generatedImageUrl = "";
    let imageGenError: string | null = null;

    try {
      const imageResult = await lingkeImageGeneration(enhancedPrompt, { size: "1024x1024", model });
      if (imageResult.images.length > 0) {
        generatedImageUrl = imageResult.images[0]!;
      }
    } catch (err: unknown) {
      imageGenError = err instanceof Error ? err.message : String(err);
    }

    // Save result
    if (recordId) {
      await db.storyboardScene.update({
        where: { id: recordId },
        data: {
          description: sceneDescription,
          imagePrompt: enhancedPrompt,
          generatedImageUrl: generatedImageUrl || imageGenError || "",
          referenceImageUrl: referenceImageBase64 ? `data:image/jpeg;base64,${referenceImageBase64}` : "",
          status: generatedImageUrl ? "done" : "pending",
        },
      });
    }

    return NextResponse.json({
      success: true,
      enhancedPrompt,
      sceneDescription,
      generatedImageUrl,
      imageGenError,
      model: "GPT-5.5-High + GPT Image 2 (灵客)",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Storyboard generation error:", msg);

    if (recordId) {
      await db.storyboardScene.update({
        where: { id: recordId },
        data: { status: "rejected", generatedImageUrl: msg },
      }).catch(() => {});
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
