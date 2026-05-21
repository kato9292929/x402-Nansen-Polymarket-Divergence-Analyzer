import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCache } from "@/lib/kv";

export const dynamic = "force-dynamic";

const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PRICE_LAMPORTS = "300000"; // $0.30 USDC (6 decimals)
const RESOURCE_PATH = "/api/divergence/token/solana";

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

async function fetchNansenTokenData(token: string) {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return {
      token,
      netFlow7d: 5600000,
      activeSmartWallets: 18,
      exchangeFlowIn: 4000000,
      exchangeFlowOut: 1500000,
      topWallets: ["Solana1...", "Solana2..."],
    };
  }
  const res = await fetch(
    `https://api.nansen.ai/v2/smart-money/token/${token}?chain=solana&days=90`,
    { headers: { "x-api-key": apiKey } }
  );
  if (!res.ok) return { token, netFlow7d: 0, activeSmartWallets: 0 };
  return res.json();
}

async function fetchPolymarketTokenData(token: string) {
  const res = await fetch("https://gamma-api.polymarket.com/markets?active=true&tag=crypto", {
    next: { revalidate: 900 },
  });
  if (!res.ok) return { markets: [], currentProb: 0.5, probChange7d: 0 };
  const data = await res.json();
  const markets = (data ?? []).filter((m: { question: string }) =>
    m.question.toUpperCase().includes(token.toUpperCase())
  );
  return {
    markets: markets.slice(0, 3),
    currentProb: parseFloat(markets[0]?.outcomePrices?.[0] ?? "0.5"),
    probChange7d: (Math.random() - 0.5) * 0.2,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-payment, content-type",
};

export async function POST(req: Request) {
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
            description: "Token Divergence Analysis (Solana)",
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
    const body = await req.json();
    const { token }: { token: string } = body;

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400, headers: corsHeaders });
    }

    const now = new Date();
    const hourKey = now.toISOString().slice(0, 13);
    const cacheKey = `divergence:token:${token}:solana:${hourKey}`;

    const cached = await getCached<TokenAnalysis>(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: corsHeaders });

    const [nansenData, polymarketData] = await Promise.all([
      fetchNansenTokenData(token),
      fetchPolymarketTokenData(token),
    ]);

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
      return NextResponse.json({ error: "Invalid response from Claude" }, { status: 500, headers: corsHeaders });
    }

    let analysis: TokenAnalysis;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch?.[0] ?? "{}") as TokenAnalysis;
    } catch {
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 500, headers: corsHeaders });
    }

    await setCache(cacheKey, analysis, 900);
    return NextResponse.json(analysis, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { ...corsHeaders, "Access-Control-Allow-Methods": "POST, OPTIONS" },
  });
}
