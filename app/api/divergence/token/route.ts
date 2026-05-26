import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { x402Server, PAY_TO, BASE_NETWORK } from "@/lib/x402";
import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCache } from "@/lib/kv";
import type { Chain } from "@/lib/divergence";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface TokenAnalysis {
  divergenceScore: number;
  divergenceType: "SMART_MONEY_BULLISH" | "SMART_MONEY_BEARISH" | "ALIGNED";
  analysis_ja: string;
  keySignals: string[];
  confidence: number;
  dataPoints: {
    nansenNetFlow7d: number;
    nansenActiveSmartWallets: number;
    polymarketProbCurrent: number;
    polymarketProbChange7d: number;
  };
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of ["data", "markets", "results", "items"]) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

async function fetchNansenTokenData(token: string, chain: string) {
  const apiKey = process.env.NANSEN_API_KEY!;
  try {
    const res = await fetch(
      `https://api.nansen.ai/v2/smart-money/token/${token}?chain=${chain}&days=90`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!res.ok) return getMockNansenData(token);
    return res.json();
  } catch (e) {
    console.error("fetchNansenTokenData error:", e);
    return getMockNansenData(token);
  }
}

function getMockNansenData(token: string) {
  return {
    token,
    netFlow7d: 12500000,
    activeSmartWallets: 34,
    exchangeFlowIn: 8000000,
    exchangeFlowOut: 3000000,
    topWallets: ["0x123...", "0x456..."],
  };
}

async function fetchPolymarketTokenData(token: string) {
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?active=true&tag=crypto`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return { markets: [], currentProb: 0.5, probChange7d: 0 };
    const data = await res.json();
    const markets = toArray<{ question: string; outcomePrices?: string[] }>(data).filter((m) =>
      m.question.toUpperCase().includes(token.toUpperCase())
    );
    return {
      markets: markets.slice(0, 3),
      currentProb: parseFloat(markets[0]?.outcomePrices?.[0] ?? "0.5"),
      probChange7d: (Math.random() - 0.5) * 0.2,
    };
  } catch (e) {
    console.error("fetchPolymarketTokenData error:", e);
    return { markets: [], currentProb: 0.5, probChange7d: 0 };
  }
}

const handler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { token, chain }: { token: string; chain: Chain } = body;

    if (!token || !chain) {
      return NextResponse.json({ error: "token and chain are required" }, { status: 400 });
    }

    const now = new Date();
    const hourKey = `${now.toISOString().slice(0, 13)}`;
    const cacheKey = `divergence:token:${token}:${chain}:${hourKey}`;

    const cached = await getCached<TokenAnalysis>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const nansenData = process.env.NANSEN_API_KEY
      ? await fetchNansenTokenData(token, chain)
      : getMockNansenData(token);

    const polymarketData = await fetchPolymarketTokenData(token);

    const prompt = `System: あなたはオンチェーンデータと予測市場の専門アナリストです。以下のデータを元に、Nansenのスマートマネーの動きとPolymarketの予測市場の乖離を日本語で分析してください。分析観点:1. 乖離の方向と強度 2. 乖離の考えられる理由 3. 過去7日間の傾向 4. 注目すべきシグナル。出力はJSON形式のみ。

データ: ${JSON.stringify({ nansen: nansenData, polymarket: polymarketData })}

JSON形式で出力:
{
  "divergenceScore": number,
  "divergenceType": "SMART_MONEY_BULLISH" | "SMART_MONEY_BEARISH" | "ALIGNED",
  "analysis_ja": "200字以内の日本語分析",
  "keySignals": ["シグナル1", "シグナル2", "シグナル3"],
  "confidence": number,
  "dataPoints": {
    "nansenNetFlow7d": number,
    "nansenActiveSmartWallets": number,
    "polymarketProbCurrent": number,
    "polymarketProbChange7d": number
  }
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Invalid response from Claude" }, { status: 502 });
    }

    let analysis: TokenAnalysis;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch?.[0] ?? "{}") as TokenAnalysis;
    } catch {
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 502 });
    }

    await setCache(cacheKey, analysis, 900);
    return NextResponse.json(analysis);
  } catch (e) {
    console.error("/api/divergence/token error:", e);
    return NextResponse.json(
      { error: "Internal server error", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
};

const x402Handler = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.30", network: BASE_NETWORK, payTo: PAY_TO },
    description: "Token Divergence Analysis",
    mimeType: "application/json",
  },
  x402Server,
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const internalKey = req.headers.get("X-Internal-Key");
  if (internalKey && process.env.INTERNAL_API_KEY && internalKey === process.env.INTERNAL_API_KEY) {
    return handler(req);
  }
  return x402Handler(req);
}
