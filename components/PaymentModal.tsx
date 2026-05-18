"use client";

import { useState } from "react";
import { DivergenceResult } from "@/lib/divergence";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Chain = "base" | "polygon" | "solana";
type PaymentMethod = "USDC" | "JPYC";

interface Props {
  result: DivergenceResult | null;
  onClose: () => void;
  onPay: (chain: Chain, method: PaymentMethod) => void;
}

export function PaymentModal({ result, onClose, onPay }: Props) {
  const [chain, setChain] = useState<Chain>("base");
  const [method, setMethod] = useState<PaymentMethod>("USDC");

  if (!result) return null;

  const isJpycAvailable = chain !== "solana";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0d1b2a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 text-xl font-mono"
        >
          ✕
        </button>

        <h2 className="font-mono text-lg font-bold text-white mb-1">詳細分析</h2>
        <p className="font-mono text-sm text-slate-400 mb-4">
          {result.token} — スコア <span className="text-red-400">{result.divergenceScore.toFixed(2)}</span>
        </p>

        <div className="mb-4">
          <p className="text-xs font-mono text-slate-500 mb-2">NETWORK</p>
          <div className="flex gap-2">
            {(["base", "polygon", "solana"] as Chain[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setChain(c);
                  if (c === "solana") setMethod("USDC");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold border transition-colors ${
                  chain === c
                    ? "bg-blue-600/30 border-blue-500 text-blue-300"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {chain === "solana" && (
          <div className="mb-4 rounded-lg border border-yellow-700/40 bg-yellow-900/20 px-3 py-2 text-xs font-mono text-yellow-300">
            SolanaネットワークではUSDC決済のみご利用いただけます
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-mono text-slate-500 mb-2">PAYMENT METHOD</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("USDC")}
              className={`px-4 py-2 rounded text-xs font-mono font-semibold border transition-colors ${
                method === "USDC"
                  ? "bg-blue-600/30 border-blue-500 text-blue-300"
                  : "border-slate-600 text-slate-400 hover:border-slate-500"
              }`}
            >
              USDC {chain === "base" ? "on Base" : chain === "polygon" ? "on Polygon" : "on Solana"}
            </button>
            <button
              onClick={() => isJpycAvailable && setMethod("JPYC")}
              disabled={!isJpycAvailable}
              className={`px-4 py-2 rounded text-xs font-mono font-semibold border transition-colors ${
                !isJpycAvailable
                  ? "border-slate-700 text-slate-600 cursor-not-allowed opacity-40"
                  : method === "JPYC"
                  ? "bg-purple-600/30 border-purple-500 text-purple-300"
                  : "border-slate-600 text-slate-400 hover:border-slate-500"
              }`}
            >
              JPYC on Polygon
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Analysis fee</span>
            <span className="text-white font-bold">$0.30 {method}</span>
          </div>
        </div>

        <div className="mb-4">
          <ConnectButton />
        </div>

        <button
          onClick={() => onPay(chain, method)}
          className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          支払いして分析を取得 →
        </button>

        <p className="mt-4 text-xs text-slate-500 font-mono text-center">
          本ツールは情報提供のみを目的としています。投資判断はご自身で行ってください。
        </p>
      </div>
    </div>
  );
}
