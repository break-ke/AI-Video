const BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || "";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function deepseekChat(messages: Message[], options?: { maxTokens?: number; temperature?: number }) {
  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "deepseek-v4-pro",
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.3,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 500)}`);
  }

  const data = await res.json();
  // Extract text from Anthropic-format response
  const textBlocks = data.content?.filter((c: { type: string }) => c.type === "text") || [];
  return {
    text: textBlocks.map((b: { text: string }) => b.text).join(""),
    usage: data.usage,
  };
}
