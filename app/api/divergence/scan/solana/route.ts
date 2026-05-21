import { NextResponse } from "next/server";
import { calculateDivergence, getDivergenceType, type DivergenceResult } from "@/lib/divergence";
import { getCached, setCache } from "@/lib/kv";

export const dynamic = "force-dynamic";

const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PRICE_LAMPORTS = "150000"; // $0.15 USDC (6 decimals)
const RESOURCE_PATH = "/api/divergence/scan/solana";

async function fetchNansenFlows(): Promise<Array<{ token: string; netFlowUsd: number; smartWallets: number }>> {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return [
      { token: "SOL", netFlowUsd: 5600000, smartWallets: 18 },
      { token: "ETH", netFlowUsd: 12500000, smartWallets: 34 },
      { token: "BTC", netFlowUsd: -8200000, smartWallets: 22 },
    ];
  }
  const res = await fetch(
    `https://api.nansen.ai/v2/smart-money/token-flows?chain=solana`,
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

async function fetchPolymarketData(): Promise<Array<{ id: string; question: string; probability: number; tokens: string[] }>> {
  const res = await fetch("https://gamma-api.polymarket.com/markets?active=true&tag=crypto", {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const knownTokens = ["BTC", "ETH", "SOL", "MATIC", "ARB", "LINK", "UNI", "AAVE", "OP", "AVAX"];
  return (data ?? []).map((m: { id: string; question: string; outcomePrices?: string[] }) => ({
    id: m.id,
    question: m.question,
    probability: parseFloat(m.outcomePrices?.[0] ?? "0.5"),
    tokens: knownTokens.filter((t) => m.question.toUpperCase().includes(t)),
  }));
}

async function runScan(): Promise<{ scannedAt: string; chain: string; results: DivergenceResult[] }> {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13);
  const cacheKey = `divergence:scan:solana:${hourKey}`;

  const cached = await getCached<{ scannedAt: string; chain: string; results: DivergenceResult[] }>(cacheKey);
  if (cached) return cached;

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
  return response;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-payment, content-type",
};

export async function GET(req: Request) {
  const paymentHeader = req.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    return new NextResponse(
      JSON.stringify({
        error: "Payment Required",
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "solana-mainnet",
            maxAmountRequired: PRICE_LAMPORTS,
            resource: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${RESOURCE_PATH}`,
            description: "Divergence Scan - Top 10 (Solana)",
            mimeType: "application/json",
            payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
            maxTimeoutSeconds: 300,
            asset: USDC_SOLANA,
          },
        ],
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const data = await runScan();
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { ...corsHeaders, "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}
