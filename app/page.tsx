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
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-bg-primary font-outfit">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-sm border-b border-[#2a2a2a]" style={{ borderBottomColor: "rgba(200,169,110,0.25)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-outfit font-bold text-xl tracking-[0.05em] text-gold">
                DIVERGENCE ANALYZER
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-outfit font-medium border border-gold/40 text-gold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                LIVE DATA
              </span>
            </div>
            <p className="font-outfit font-light text-xs mt-1" style={{ color: "#a09080" }}>
              Nansenのスマートマネー × Polymarketの予測市場 — 乖離を検出する
            </p>
          </div>

          {/* Chain Selector */}
          <div className="flex gap-1.5">
            {(["base", "polygon", "solana"] as Chain[]).map((chain) => (
              <button
                key={chain}
                onClick={() => setSelectedChain(chain)}
                className={`px-3 py-1.5 rounded text-xs font-outfit font-medium border transition-all tracking-wide ${
                  selectedChain === chain
                    ? "border-gold text-gold bg-gold/10"
                    : "border-[#2a2a2a] text-[#6b5f50] hover:border-gold/40 hover:text-[#a09080]"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "TOKENS SCANNED", value: "247", unit: "", gold: false },
            { label: "HIGH DIVERGENCE", value: "3", unit: "alerts", gold: true },
            { label: "AVG SCORE", value: "0.42", unit: "", gold: false },
            { label: "LAST SCAN", value: "2m", unit: "ago", gold: false },
          ].map((stat) => (
            <div key={stat.label} className="rounded border border-[#2a2a2a] bg-bg-secondary px-4 py-3">
              <p className="font-outfit font-medium text-[10px] uppercase tracking-[0.15em]" style={{ color: "#6b5f50" }}>
                {stat.label}
              </p>
              <p className={`font-outfit font-bold text-2xl mt-1 tabular-nums ${stat.gold ? "text-gold" : ""}`} style={!stat.gold ? { color: "#f5f0e8" } : undefined}>
                {stat.value}
                {stat.unit && (
                  <span className="text-sm font-normal ml-1" style={{ color: "#a09080" }}>
                    {stat.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-outfit font-semibold text-xs uppercase tracking-[0.15em] text-gold">
              Divergence Scan — {selectedChain.toUpperCase()}
            </h2>
            <p className="font-outfit font-light text-xs mt-0.5" style={{ color: "#6b5f50" }}>
              Top 10 tokens by divergence score | Updated every 30 min
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-outfit font-medium uppercase tracking-wider" style={{ color: "#6b5f50" }}>
            <span className="w-2 h-2 rounded-sm" style={{ background: "#fbbf2440", border: "1px solid #fbbf2460" }} /> HIGH
            <span className="w-2 h-2 rounded-sm ml-2" style={{ background: "#c8a96e30", border: "1px solid #c8a96e60" }} /> MED
            <span className="w-2 h-2 rounded-sm ml-2" style={{ background: "#4ade8030", border: "1px solid #4ade8060" }} /> LOW
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-4 px-4 py-2.5 flex items-center gap-2.5 rounded-r"
          style={{ background: "rgba(200,169,110,0.08)", borderLeft: "3px solid #c8a96e" }}>
          <span className="text-gold text-sm">ℹ</span>
          <span className="font-outfit font-normal text-xs text-gold">
            デモデータを表示中。「詳細分析」ボタンをクリックしてx402決済でリアルタイムデータを取得できます。
          </span>
        </div>

        <DivergenceTable data={MOCK_DIVERGENCE_DATA} onAnalyze={handleAnalyze} />

        {/* Footer */}
        <footer className="mt-12 pt-8 pb-4 border-t border-[#2a2a2a]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-outfit font-light text-xs" style={{ color: "#6b5f50" }}>
              Powered by x402 · Nansen · Polymarket · Claude AI
            </p>
            <div className="flex gap-4 text-xs font-outfit font-light" style={{ color: "#6b5f50" }}>
              <span>Scan: $0.15 USDC</span>
              <span>Analysis: $0.30 USDC</span>
              <span>Weekly Report: $1.00 USDC</span>
            </div>
          </div>
          <p className="mt-4 font-outfit font-light text-xs text-center" style={{ color: "#6b5f50" }}>
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
