export type Chain = "base" | "polygon" | "solana";
export type DivergenceType = "SMART_MONEY_BULLISH" | "SMART_MONEY_BEARISH" | "ALIGNED";

export interface DivergenceResult {
  token: string;
  nansenNetFlowUsd: number;
  nansenSmartWallets: number;
  nansenSignal: "BULLISH" | "BEARISH" | "NEUTRAL";
  polymarketMarketId: string;
  polymarketQuestion: string;
  polymarketProbability: number;
  divergenceScore: number;
  divergenceType: DivergenceType;
  summary_ja: string;
}

export interface ScanResponse {
  scannedAt: string;
  chain: Chain;
  results: DivergenceResult[];
}

export function calculateDivergence(nansenNetFlow: number, polymarketProb: number): number {
  const nansenNormalized = Math.tanh(nansenNetFlow / 1_000_000);
  const nansenBullish = (nansenNormalized + 1) / 2;
  return Math.abs(nansenBullish - polymarketProb);
}

export function getDivergenceType(nansenNetFlow: number, polymarketProb: number): DivergenceType {
  const nansenNormalized = Math.tanh(nansenNetFlow / 1_000_000);
  const score = calculateDivergence(nansenNetFlow, polymarketProb);
  if (score < 0.2) return "ALIGNED";
  if (nansenNormalized > 0 && polymarketProb < 0.5) return "SMART_MONEY_BULLISH";
  if (nansenNormalized < 0 && polymarketProb > 0.5) return "SMART_MONEY_BEARISH";
  return "ALIGNED";
}

// Mock data for initial page load (before payment)
export const MOCK_DIVERGENCE_DATA: DivergenceResult[] = [
  {
    token: "ETH",
    nansenNetFlowUsd: 12500000,
    nansenSmartWallets: 34,
    nansenSignal: "BULLISH",
    polymarketMarketId: "eth-3000-june",
    polymarketQuestion: "Will ETH be above $3000 by June?",
    polymarketProbability: 0.31,
    divergenceScore: 0.84,
    divergenceType: "SMART_MONEY_BULLISH",
    summary_ja: "スマートマネーが強気姿勢を示す一方、予測市場は弱気。乖離スコア: 0.84",
  },
  {
    token: "BTC",
    nansenNetFlowUsd: -8200000,
    nansenSmartWallets: 22,
    nansenSignal: "BEARISH",
    polymarketMarketId: "btc-70k-june",
    polymarketQuestion: "Will BTC reach $70K by June?",
    polymarketProbability: 0.78,
    divergenceScore: 0.76,
    divergenceType: "SMART_MONEY_BEARISH",
    summary_ja: "スマートマネーが売却している一方、予測市場は強気。乖離スコア: 0.76",
  },
  {
    token: "SOL",
    nansenNetFlowUsd: 5600000,
    nansenSmartWallets: 18,
    nansenSignal: "BULLISH",
    polymarketMarketId: "sol-200-june",
    polymarketQuestion: "Will SOL be above $200 by June?",
    polymarketProbability: 0.42,
    divergenceScore: 0.71,
    divergenceType: "SMART_MONEY_BULLISH",
    summary_ja: "オンチェーンの資金流入が続く中、市場は慎重姿勢。乖離スコア: 0.71",
  },
  {
    token: "MATIC",
    nansenNetFlowUsd: 3100000,
    nansenSmartWallets: 12,
    nansenSignal: "BULLISH",
    polymarketMarketId: "matic-1-june",
    polymarketQuestion: "Will MATIC be above $1 by June?",
    polymarketProbability: 0.55,
    divergenceScore: 0.43,
    divergenceType: "SMART_MONEY_BULLISH",
    summary_ja: "スマートマネーの買いと市場の中立姿勢が乖離。乖離スコア: 0.43",
  },
  {
    token: "ARB",
    nansenNetFlowUsd: 1800000,
    nansenSmartWallets: 9,
    nansenSignal: "BULLISH",
    polymarketMarketId: "arb-2-june",
    polymarketQuestion: "Will ARB be above $2 by June?",
    polymarketProbability: 0.48,
    divergenceScore: 0.38,
    divergenceType: "SMART_MONEY_BULLISH",
    summary_ja: "小規模な乖離が検出。スマートマネーがやや強気。乖離スコア: 0.38",
  },
  {
    token: "LINK",
    nansenNetFlowUsd: -1200000,
    nansenSmartWallets: 8,
    nansenSignal: "BEARISH",
    polymarketMarketId: "link-20-june",
    polymarketQuestion: "Will LINK be above $20 by June?",
    polymarketProbability: 0.52,
    divergenceScore: 0.31,
    divergenceType: "SMART_MONEY_BEARISH",
    summary_ja: "わずかな下方乖離。スマートマネーが慎重姿勢。乖離スコア: 0.31",
  },
  {
    token: "UNI",
    nansenNetFlowUsd: 900000,
    nansenSmartWallets: 7,
    nansenSignal: "BULLISH",
    polymarketMarketId: "uni-15-june",
    polymarketQuestion: "Will UNI be above $15 by June?",
    polymarketProbability: 0.51,
    divergenceScore: 0.18,
    divergenceType: "ALIGNED",
    summary_ja: "両シグナルが概ね一致。乖離は低水準。乖離スコア: 0.18",
  },
  {
    token: "AAVE",
    nansenNetFlowUsd: 600000,
    nansenSmartWallets: 6,
    nansenSignal: "BULLISH",
    polymarketMarketId: "aave-150-june",
    polymarketQuestion: "Will AAVE be above $150 by June?",
    polymarketProbability: 0.53,
    divergenceScore: 0.12,
    divergenceType: "ALIGNED",
    summary_ja: "スマートマネーと予測市場が方向一致。乖離なし。乖離スコア: 0.12",
  },
];
