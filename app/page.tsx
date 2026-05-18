"use client";

import { useState } from "react";
import { DivergenceTable } from "@/components/DivergenceTable";
import { PaymentModal } from "@/components/PaymentModal";
import { MOCK_DIVERGENCE_DATA, DivergenceResult } from "@/lib/divergence";
import type { Chain } from "@/lib/divergence";

type PaymentMethod = "USDC" | "JPYC";

export default function Home() {
  const [selectedChain, setSelectedChain] = useState<Chain>("base");
  const [selectedResult, setSelectedResult] = useState<DivergenceResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnalyze = (result: DivergenceResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handlePay = async (chain: Chain, method: PaymentMethod) => {
    console.log("Payment triggered:", { chain, method, token: selectedResult?.token });
    // x402 payment flow would be triggered here
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#080f1a" }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a1525]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl font-bold text-white tracking-widest">
                DIVERGENCE ANALYZER
              </h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-green-900/30 text-green-400 border border-green-700/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE DATA
              </span>
            </div>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Nansenのスマートマネー × Polymarketの予測市場 — 乖離を検出する
            </p>
          </div>

          {/* Chain Selector */}
          <div className="flex gap-1.5">
            {(["base", "polygon", "solana"] as Chain[]).map((chain) => (
              <button
                key={chain}
                onClick={() => setSelectedChain(chain)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  selectedChain === chain
                    ? "bg-blue-600/30 border-blue-500 text-blue-300 shadow-blue-900/20 shadow-md"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {chain === "base" ? "Base" : chain === "polygon" ? "Polygon" : "Solana"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "TOKENS SCANNED", value: "247", unit: "" },
            { label: "HIGH DIVERGENCE", value: "3", unit: "alerts" },
            { label: "AVG SCORE", value: "0.42", unit: "" },
            { label: "LAST SCAN", value: "2m", unit: "ago" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-700/50 bg-[#1e2d3d]/50 px-4 py-3">
              <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="font-mono text-2xl font-bold text-white mt-1">
                {stat.value}
                {stat.unit && <span className="text-sm text-slate-400 ml-1">{stat.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Divergence Scan — {selectedChain.toUpperCase()}
            </h2>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Top 10 tokens by divergence score | Updated every 30 min
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-sm bg-red-900/60 border border-red-700/40" /> HIGH
            <span className="w-2 h-2 rounded-sm bg-yellow-900/60 border border-yellow-700/40 ml-2" /> MED
            <span className="w-2 h-2 rounded-sm bg-green-900/60 border border-green-700/40 ml-2" /> LOW
          </div>
        </div>

        {/* Mock data notice */}
        <div className="mb-4 rounded-lg border border-blue-800/40 bg-blue-900/10 px-4 py-2.5 flex items-center gap-2">
          <span className="text-blue-400 text-sm">&#x2139;</span>
          <span className="font-mono text-xs text-blue-300">
            デモデータを表示中。「詳細分析」ボタンをクリックしてx402決済でリアルタイムデータを取得できます。
          </span>
        </div>

        <DivergenceTable data={MOCK_DIVERGENCE_DATA} onAnalyze={handleAnalyze} />

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-slate-600">
                Powered by x402 · Nansen · Polymarket · Claude AI
              </p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-slate-600">
              <span>Scan: $0.15 USDC</span>
              <span>Analysis: $0.30 USDC</span>
              <span>Weekly Report: $1.00 USDC</span>
            </div>
          </div>
          <p className="mt-4 font-mono text-xs text-slate-700 text-center">
            本ツールは情報提供のみを目的としています。投資判断はご自身で行ってください。
          </p>
        </footer>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          result={selectedResult}
          onClose={() => setIsModalOpen(false)}
          onPay={handlePay}
        />
      )}
    </main>
  );
}
