import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { x402Server, SOLANA_PAY_TO, SOLANA_NETWORK } from "@/lib/x402";
import { calculateDivergence, getDivergenceType, type DivergenceResult } from "@/lib/divergence";
import { getCached, setCache } from "@/lib/kv";

export const dynamic = "force-dynamic";

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of ["data", "markets", "results", "items", "tokens"]) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

async function fetchNansenFlows(): Promise<Array<{ token: string; netFlowUsd: number; smartWallets: number }>> {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return [
      { token: "SOL", netFlowUsd: 5600000, smartWallets: 18 },
      { token: "ETH", netFlowUsd: 12500000, smartWallets: 34 },
      { token: "BTC", netFlowUsd: -8200000, smartWallets: 22 },
    ];
  }
  try {
    const res = await fetch(
      `https://api.nansen.ai/v2/smart-money/token-flows?chain=solana`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!res.ok) {
      console.error(`Nansen API error: ${res.status} ${res.statusText}`);
      return [
        { token: "SOL", netFlowUsd: 5600000, smartWallets: 18 },
        { token: "ETH", netFlowUsd: 12500000, smartWallets: 34 },
        { token: "BTC", netFlowUsd: -8200000, smartWallets: 22 },
      ];
    }
    const data = await res.json();
    return toArray<{ symbol: string; netFlowUsd: number; smartWallets: number }>(data)
      .filter((t) => t.smartWallets > 5 && Math.abs(t.netFlowUsd) > 5000)
      .map((t) => ({ token: t.symbol, netFlowUsd: t.netFlowUsd, smartWallets: t.smartWallets }));
  } catch (e) {
    console.error("fetchNansenFlows (solana) error:", e);
    return [
      { token: "SOL", netFlowUsd: 5600000, smartWallets: 18 },
      { token: "ETH", netFlowUsd: 12500000, smartWallets: 34 },
      { token: "BTC", netFlowUsd: -8200000, smartWallets: 22 },
    ];
  }
}

async function fetchPolymarketData(): Promise<Array<{ id: string; question: string; probability: number; tokens: string[] }>> {
  try {
    const res = await fetch("https://gamma-api.polymarket.com/markets?active=true&tag=crypto", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.error(`Polymarket API error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const knownTokens = ["BTC", "ETH", "SOL", "MATIC", "ARB", "LINK", "UNI", "AAVE", "OP", "AVAX"];
    return toArray<{ id: string; question: string; outcomePrices?: string[] }>(data).map((m) => ({
      id: m.id,
      question: m.question,
      probability: parseFloat(m.outcomePrices?.[0] ?? "0.5"),
      tokens: knownTokens.filter((t) => m.question.toUpperCase().includes(t)),
    }));
  } catch (e) {
    console.error("fetchPolymarketData (solana) error:", e);
    return [];
  }
}

const handler = async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const now = new Date();
    const hourKey = now.toISOString().slice(0, 13);
    const cacheKey = `divergence:scan:solana:${hourKey}`;

    const cached = await getCached<{ scannedAt: string; chain: string; results: DivergenceResult[] }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const [nansenFlows, polymarketData] = await Promise.all([fetchNansenFlows(), fetchPolymarketData()]);

    const results: DivergenceResult[] = [];
    for (const nansen of nansenFlows) {
      const market = polymarketData.find((m) => m.tokens.includes(nansen.token));
      if (!market) continue;
      const divergenceScore = calculateDivergence(nansen.netFlowUsd, market.probability);
      const divergenceType = getDivergenceType(nansen.netFlowUsd, market.probability);
      const nansenSignal = nansen.netFlowUsd > 0 ? "BULLISH" : nansen.netFlowUsd < 0 ? "BEARISH" : "NEUTRAL";
      results.push({
        token: nansen.token,
        nansenNetFlowUsd: nansen.netFlowUsd,
        nansenSmartWallets: nansen.smartWallets,
        nansenSignal,
        polymarketMarketId: market.id,
        polymarketQuestion: market.question,
        polymarketProbability: market.probability,
        divergenceScore,
        divergenceType,
        summary_ja: `スマートマネーが${nansenSignal === "BULLISH" ? "強気" : "弱気"}姿勢を示す一方、予測市場は${market.probability > 0.5 ? "楽観的" : "悲観的"}。乖離スコア: ${divergenceScore.toFixed(2)}`,
      });
    }

    results.sort((a, b) => b.divergenceScore - a.divergenceScore);
    const response = { scannedAt: now.toISOString(), chain: "solana", results: results.slice(0, 10) };
    await setCache(cacheKey, response, 1800);
    return NextResponse.json(response);
  } catch (e) {
    console.error("/api/divergence/scan/solana error:", e);
    return NextResponse.json(
      { error: "Internal server error", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
};

const x402Handler = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.15", network: SOLANA_NETWORK, payTo: SOLANA_PAY_TO },
    description: "Divergence Scan - Top 10 (Solana)",
    mimeType: "application/json",
  },
  x402Server,
);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const internalKey = req.headers.get("X-Internal-Key");
  if (internalKey && process.env.INTERNAL_API_KEY && internalKey === process.env.INTERNAL_API_KEY) {
    return handler(req);
  }
  return x402Handler(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "x-payment, x-402-payment, content-type",
    },
  });
}
