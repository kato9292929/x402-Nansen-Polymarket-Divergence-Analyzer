import { NextRequest } from "next/server";
import { calculateDivergence, getDivergenceType, type DivergenceResult, type Chain } from "@/lib/divergence";
import { setCache } from "@/lib/kv";

const CHAINS: Chain[] = ["base", "polygon", "solana"];

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results: Record<string, unknown> = {};

  for (const chain of CHAINS) {
    try {
      const mockData: DivergenceResult[] = [
        {
          token: "ETH",
          nansenNetFlowUsd: 12500000,
          nansenSmartWallets: 34,
          nansenSignal: "BULLISH",
          polymarketMarketId: "eth-market",
          polymarketQuestion: "Will ETH be above $3000?",
          polymarketProbability: 0.31,
          divergenceScore: calculateDivergence(12500000, 0.31),
          divergenceType: getDivergenceType(12500000, 0.31),
          summary_ja: "スマートマネーが強気姿勢。予測市場は弱気。乖離大。",
        },
      ];

      const now = new Date();
      const hourKey = now.toISOString().slice(0, 13);
      const cacheKey = `divergence:scan:${chain}:${hourKey}`;
      await setCache(cacheKey, { scannedAt: now.toISOString(), chain, results: mockData }, 1800);
      results[chain] = { success: true, count: mockData.length };
    } catch (e) {
      results[chain] = { success: false, error: String(e) };
    }
  }

  return Response.json({ ok: true, results, timestamp: new Date().toISOString() });
}
