import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { x402Server, PAY_TO, BASE_NETWORK } from "@/lib/x402";
import { calculateDivergence, getDivergenceType, type DivergenceResult, type Chain } from "@/lib/divergence";
import { getCached, setCache } from "@/lib/kv";

async function fetchNansenFlows(chain: string): Promise<Array<{
  token: string;
  netFlowUsd: number;
  smartWallets: number;
}>> {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return [
      { token: "ETH", netFlowUsd: 12500000, smartWallets: 34 },
      { token: "BTC", netFlowUsd: -8200000, smartWallets: 22 },
      { token: "SOL", netFlowUsd: 5600000, smartWallets: 18 },
    ];
  }
  const res = await fetch(
    `https://api.nansen.ai/v2/smart-money/token-flows?chain=${chain}`,
    { headers: { "x-api-key": apiKey } }
  );
  if (!res.ok) throw new Error(`Nansen API error: ${res.status}`);
  const data = await res.json();
  return (data.tokens ?? [])
    .filter((t: { smartWallets: number; netFlowUsd: number }) => t.smartWallets > 5 && Math.abs(t.netFlowUsd) > 5000)
    .map((t: { symbol: string; netFlowUsd: number; smartWallets: number }) => ({
      token: t.symbol,
      netFlowUsd: t.netFlowUsd,
      smartWallets: t.smartWallets,
    }));
}

async function fetchPolymarketData(): Promise<Array<{
  id: string;
  question: string;
  probability: number;
  tokens: string[];
}>> {
  const res = await fetch(
    "https://gamma-api.polymarket.com/markets?active=true&tag=crypto",
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data ?? []).map((m: { id: string; question: string; outcomePrices?: string[]; tokens?: Array<{ token_id: string; outcome: string }> }) => ({
    id: m.id,
    question: m.question,
    probability: parseFloat(m.outcomePrices?.[0] ?? "0.5"),
    tokens: extractTokensFromQuestion(m.question),
  }));
}

function extractTokensFromQuestion(question: string): string[] {
  const tokens = ["BTC", "ETH", "SOL", "MATIC", "ARB", "LINK", "UNI", "AAVE", "OP", "AVAX"];
  return tokens.filter((t) => question.toUpperCase().includes(t));
}

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const chain = (req.nextUrl.searchParams.get("chain") ?? "base") as Chain;

  const now = new Date();
  const hourKey = `${now.toISOString().slice(0, 13)}`;
  const cacheKey = `divergence:scan:${chain}:${hourKey}`;

  const cached = await getCached<{ scannedAt: string; chain: Chain; results: DivergenceResult[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const [nansenFlows, polymarketData] = await Promise.all([
    fetchNansenFlows(chain),
    fetchPolymarketData(),
  ]);

  const results: DivergenceResult[] = [];

  for (const nansen of nansenFlows) {
    const markets = polymarketData.filter((m) => m.tokens.includes(nansen.token));
    if (markets.length === 0) continue;

    const market = markets[0];
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
  const top10 = results.slice(0, 10);

  const response = {
    scannedAt: now.toISOString(),
    chain,
    results: top10,
  };

  await setCache(cacheKey, response, 1800);

  return NextResponse.json(response);
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.15",
      network: BASE_NETWORK,
      payTo: PAY_TO,
    },
    description: "Divergence Scan - Top 10",
    mimeType: "application/json",
  },
  x402Server,
);
