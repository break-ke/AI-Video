import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_BASE = "https://api.lk888.ai/v1";
const API_KEY = process.env.LINGKE_API_KEY || "";

// Cache models for 5 minutes
let cache: { data: Model[] | null; ts: number; type: string } = { data: null, ts: 0, type: "" };

interface Model {
  name: string;
  display_name: string;
  type: string;
  description: string;
  tags: string[];
  input_hint?: string;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "image";

  if (cache.data && cache.type === type && Date.now() - cache.ts < 300_000) {
    return NextResponse.json({ models: cache.data, cached: true });
  }

  try {
    const res = await fetch(`${API_BASE}/skills/models?type=${type}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache = { data: data.models || [], ts: Date.now(), type };
    return NextResponse.json({ models: data.models || [], cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
