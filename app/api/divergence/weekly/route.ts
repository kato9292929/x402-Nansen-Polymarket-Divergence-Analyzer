import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { x402Server, PAY_TO, BASE_NETWORK } from "@/lib/x402";
import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCache } from "@/lib/kv";
import { MOCK_DIVERGENCE_DATA } from "@/lib/divergence";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const handler = async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const weekKey = getWeekKey();
    const cacheKey = `divergence:weekly:${weekKey}`;

    const cached = await getCached<{ report: string; generatedAt: string; topDivergences: typeof MOCK_DIVERGENCE_DATA }>(cacheKey);
    if (cached) return NextResponse.json(cached);

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
      return NextResponse.json({ error: "Invalid response" }, { status: 502 });
    }

    const result = {
      report: content.text,
      generatedAt: new Date().toISOString(),
      topDivergences,
    };

    await setCache(cacheKey, result, 86400);
    return NextResponse.json(result);
  } catch (e) {
    console.error("/api/divergence/weekly error:", e);
    return NextResponse.json(
      { error: "Internal server error", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
};

const x402Handler = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$1.00", network: BASE_NETWORK, payTo: PAY_TO },
    description: "Weekly Divergence Report",
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
