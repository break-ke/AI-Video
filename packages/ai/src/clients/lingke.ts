const BASE_URL = process.env.LINGKE_API_BASE_URL || "https://api.lk888.ai/v1";
const API_KEY = process.env.LINGKE_API_KEY || "";

interface ChatMessage { role: "system" | "user" | "assistant"; content: string; }

// ── Available models on 灵客 ──
// Gemini: gemini-3.1-pro-preview, gemini-3-pro-preview, gemini-3-flash-preview, gemini-3.1-flash-lite-preview
// GPT:    gpt-5.5-xhigh, gpt-5.5-high, gpt-5.5-medium, gpt-5.5-low, gpt-5.4, gpt-5.4-mini
// Claude: claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5-20251001
// DeepSeek: deepseek-v4-pro, deepseek-v4-flash, deepseek-v3.2
// Grok:   grok-4.3, grok-4.2, grok-4.1
// Other:  doubao-seed-2-0-pro, qwen3.5-plus, MiniMax-M2.7

export async function lingkeChat(model: string, messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, max_tokens: options?.maxTokens || 4096, temperature: options?.temperature ?? 0.4, messages }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`灵客 API ${res.status}: ${err.slice(0, 500)}`); }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || "", usage: data.usage, model: data.model };
}

// Gemini for video/multimodal analysis
export async function lingkeGeminiChat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }) {
  return lingkeChat("gemini-3.1-pro-preview", messages, options);
}

// GPT for creative writing
export async function lingkeGPTChat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }) {
  return lingkeChat("gpt-5.5-high", messages, options);
}

// Claude for deep reasoning
export async function lingkeClaudeChat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }) {
  return lingkeChat("claude-opus-4-7", messages, options);
}

// ── Image generation via 灵客 media API (async submit + poll) ──
const IMAGE_MODEL = "gpt-image-2";

export async function lingkeImageGeneration(prompt: string, options?: { size?: string; n?: number; model?: string }): Promise<{ images: string[]; model: string; cost?: number }> {
  // Step 1: Submit generation task
  const submitRes = await fetch(`${BASE_URL}/media/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: options?.model || IMAGE_MODEL,
      prompt,
      params: { size: options?.size || "1024x1024", quality: "auto" },
    }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok || submitData.code !== 200) {
    const detail = submitData.data?.["详情"] || submitData.data?.error || "";
    throw new Error(`灵客 Image: ${submitData.msg || "请求失败"}${detail ? ` — ${detail}` : ""}`);
  }
  const taskId: number = submitData.data?.task_id;
  if (!taskId) throw new Error(`灵客 Image: 未返回 task_id`);

  // Step 2: Poll until complete (max 120s) with exponential backoff
  const deadline = Date.now() + 120_000;
  let attempt = 0;
  while (Date.now() < deadline) {
    const statusRes = await fetch(`${BASE_URL}/skills/task-status?task_id=${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!statusRes.ok) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      continue;
    }
    attempt = 0;

    const statusData = await statusRes.json();
    if (statusData.is_final) {
      if (statusData.state === "success" && statusData.result_url) {
        return { images: [statusData.result_url], model: IMAGE_MODEL, cost: statusData.cost };
      }
      throw new Error(`灵客 Image: ${statusData.status || "生成失败"}`);
    }
  }
  throw new Error("灵客 Image: 生成超时（超过120秒）");
}

// ── Vision analysis for reference images ──
export async function lingkeVisionAnalysis(prompt: string, imageBase64: string, model = "gpt-5.5-high"): Promise<string> {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ];
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, max_tokens: 2048, temperature: 0.4, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`灵客 Vision API ${res.status}: ${err.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Video generation via 灵客 media API (async submit + poll) ──
const VIDEO_MODEL = "kwvideo-v2-ref";

export async function lingkeVideoGeneration(prompt: string, imageUrls: string[], options?: { duration?: string; resolution?: string; model?: string }): Promise<{ videoUrl: string; model: string; taskId: number; cost?: number }> {
  // Step 1: Submit video generation task
  const submitRes = await fetch(`${BASE_URL}/media/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: options?.model || VIDEO_MODEL,
      prompt,
      params: {
        images: imageUrls,
        duration: options?.duration || "auto",
        version: "快速",
        resolution: options?.resolution || "720p",
        aspect_ratio: "adaptive",
      },
    }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok || submitData.code !== 200) {
    const detail = submitData.data?.["详情"] || submitData.data?.error || "";
    throw new Error(`灵客 Video: ${submitData.msg || "请求失败"}${detail ? ` — ${detail}` : ""}`);
  }
  const taskId: number = submitData.data?.task_id;
  if (!taskId) throw new Error(`灵客 Video: 未返回 task_id`);

  // Step 2: Poll until complete (max 10 minutes for video) with exponential backoff
  const deadline = Date.now() + 600_000;
  let attempt = 0;
  while (Date.now() < deadline) {
    const statusRes = await fetch(`${BASE_URL}/skills/task-status?task_id=${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!statusRes.ok) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      continue;
    }
    attempt = 0;

    const statusData = await statusRes.json();
    if (statusData.is_final) {
      if (statusData.state === "success" && statusData.result_url) {
        return { videoUrl: statusData.result_url, model: VIDEO_MODEL, taskId, cost: statusData.cost };
      }
      throw new Error(`视频生成失败: ${statusData.status || "未知错误"}`);
    }
  }
  throw new Error("视频生成超时（超过10分钟）");
}

export async function checkLingKeHealth(): Promise<{ ok: boolean; models: number; error?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${BASE_URL}/models`, { headers: { Authorization: `Bearer ${API_KEY}` }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, models: data.data?.length || 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? (err.name === "AbortError" ? "连接超时" : err.message) : String(err);
    return { ok: false, models: 0, error: msg };
  }
}
