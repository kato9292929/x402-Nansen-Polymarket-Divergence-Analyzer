import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCache } from "@/lib/kv";
import { MOCK_DIVERGENCE_DATA } from "@/lib/divergence";

export const dynamic = "force-dynamic";

const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PRICE_LAMPORTS = "1000000"; // $1.00 USDC (6 decimals)
const RESOURCE_PATH = "/api/divergence/weekly/solana";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
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
            description: "Weekly Divergence Report (Solana)",
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
    const weekKey = getWeekKey();
    const cacheKey = `divergence:weekly:solana:${weekKey}`;

    const cached = await getCached<{ report: string; generatedAt: string; topDivergences: typeof MOCK_DIVERGENCE_DATA }>(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: corsHeaders });

    const topDivergences = MOCK_DIVERGENCE_DATA.filter((d) => d.divergenceScore > 0.5).slice(0, 5);

    const prompt = `あなたはオンチェーンデータと予測市場の専門アナリストです。以下の週次乖離データを元に、日本語で包括的なウィークリーレポートを作成してください（約1,500字）。

データ: ${JSON.stringify(topDivergences)}

レポートには以下を含めてください:
1. 週次サマリー
2. 最も注目すべき乖離トップ3の詳細分析
3. マクロ的な観点からの考察
4. 来週への展望と注目ポイント

Markdown形式で出力してください。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Invalid response" }, { status: 500, headers: corsHeaders });
    }

    const result = {
      report: content.text,
      generatedAt: new Date().toISOString(),
      topDivergences,
    };

    await setCache(cacheKey, result, 86400);
    return NextResponse.json(result, { headers: corsHeaders });
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
