import { NextResponse } from "next/server";
import { PAY_TO, SOLANA_PAY_TO, BASE_NETWORK, SOLANA_NETWORK } from "@/lib/x402";

export const dynamic = "force-dynamic";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function GET() {
  const discovery = {
    x402Version: 2,
    endpoints: [
      {
        path: "/api/divergence/scan",
        method: "GET",
        description: "Divergence Scan - Top 10 (Base)",
        accepts: [{ scheme: "exact", network: BASE_NETWORK, maxAmountRequired: "150000", resource: `${APP_URL}/api/divergence/scan`, payTo: PAY_TO, asset: USDC_BASE }],
      },
      {
        path: "/api/divergence/token",
        method: "POST",
        description: "Token Divergence Analysis (Base)",
        accepts: [{ scheme: "exact", network: BASE_NETWORK, maxAmountRequired: "300000", resource: `${APP_URL}/api/divergence/token`, payTo: PAY_TO, asset: USDC_BASE }],
      },
      {
        path: "/api/divergence/weekly",
        method: "GET",
        description: "Weekly Divergence Report (Base)",
        accepts: [{ scheme: "exact", network: BASE_NETWORK, maxAmountRequired: "1000000", resource: `${APP_URL}/api/divergence/weekly`, payTo: PAY_TO, asset: USDC_BASE }],
      },
      {
        path: "/api/divergence/scan/solana",
        method: "GET",
        description: "Divergence Scan - Top 10 (Solana)",
        accepts: [{ scheme: "exact", network: SOLANA_NETWORK, maxAmountRequired: "150000", resource: `${APP_URL}/api/divergence/scan/solana`, payTo: SOLANA_PAY_TO, asset: USDC_SOLANA }],
      },
      {
        path: "/api/divergence/token/solana",
        method: "POST",
        description: "Token Divergence Analysis (Solana)",
        accepts: [{ scheme: "exact", network: SOLANA_NETWORK, maxAmountRequired: "300000", resource: `${APP_URL}/api/divergence/token/solana`, payTo: SOLANA_PAY_TO, asset: USDC_SOLANA }],
      },
      {
        path: "/api/divergence/weekly/solana",
        method: "GET",
        description: "Weekly Divergence Report (Solana)",
        accepts: [{ scheme: "exact", network: SOLANA_NETWORK, maxAmountRequired: "1000000", resource: `${APP_URL}/api/divergence/weekly/solana`, payTo: SOLANA_PAY_TO, asset: USDC_SOLANA }],
      },
    ],
  };

  return NextResponse.json(discovery, {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
