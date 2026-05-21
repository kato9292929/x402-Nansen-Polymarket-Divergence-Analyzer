import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WALLET_EVM = (process.env.WALLET_ADDRESS ?? "0x0000000000000000000000000000000000000000") as string;
const WALLET_SOLANA = process.env.SOLANA_WALLET_ADDRESS ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function GET() {
  const discovery = {
    x402Version: 1,
    endpoints: [
      // EVM endpoints (Base, via withX402)
      {
        path: "/api/divergence/scan",
        method: "GET",
        description: "Divergence Scan - Top 10 (Base)",
        accepts: [
          {
            scheme: "exact",
            network: "base-mainnet",
            maxAmountRequired: "150000",
            resource: `${APP_URL}/api/divergence/scan`,
            payTo: WALLET_EVM,
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
          },
        ],
      },
      {
        path: "/api/divergence/token",
        method: "POST",
        description: "Token Divergence Analysis (Base)",
        accepts: [
          {
            scheme: "exact",
            network: "base-mainnet",
            maxAmountRequired: "300000",
            resource: `${APP_URL}/api/divergence/token`,
            payTo: WALLET_EVM,
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          },
        ],
      },
      {
        path: "/api/divergence/weekly",
        method: "GET",
        description: "Weekly Divergence Report (Base)",
        accepts: [
          {
            scheme: "exact",
            network: "base-mainnet",
            maxAmountRequired: "1000000",
            resource: `${APP_URL}/api/divergence/weekly`,
            payTo: WALLET_EVM,
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          },
        ],
      },
      // Solana endpoints (manual 402)
      {
        path: "/api/divergence/scan/solana",
        method: "GET",
        description: "Divergence Scan - Top 10 (Solana)",
        accepts: [
          {
            scheme: "exact",
            network: "solana-mainnet",
            maxAmountRequired: "150000",
            resource: `${APP_URL}/api/divergence/scan/solana`,
            payTo: WALLET_SOLANA,
            asset: USDC_SOLANA,
          },
        ],
      },
      {
        path: "/api/divergence/token/solana",
        method: "POST",
        description: "Token Divergence Analysis (Solana)",
        accepts: [
          {
            scheme: "exact",
            network: "solana-mainnet",
            maxAmountRequired: "300000",
            resource: `${APP_URL}/api/divergence/token/solana`,
            payTo: WALLET_SOLANA,
            asset: USDC_SOLANA,
          },
        ],
      },
      {
        path: "/api/divergence/weekly/solana",
        method: "GET",
        description: "Weekly Divergence Report (Solana)",
        accepts: [
          {
            scheme: "exact",
            network: "solana-mainnet",
            maxAmountRequired: "1000000",
            resource: `${APP_URL}/api/divergence/weekly/solana`,
            payTo: WALLET_SOLANA,
            asset: USDC_SOLANA,
          },
        ],
      },
    ],
  };

  return NextResponse.json(discovery, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
