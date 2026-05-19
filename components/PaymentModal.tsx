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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded border p-6 shadow-2xl font-outfit"
        style={{ background: "#111111", borderColor: "rgba(200,169,110,0.25)" }}>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-lg transition-colors"
          style={{ color: "#6b5f50" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6b5f50"; }}
        >
          ✕
        </button>

        <h2 className="font-outfit font-bold text-lg tracking-[0.05em] text-gold mb-1">詳細分析</h2>
        <p className="font-outfit font-normal text-sm mb-5" style={{ color: "#a09080" }}>
          {result.token} — スコア{" "}
          <span style={{ color: "#fbbf24" }} className="font-semibold tabular-nums">
            {result.divergenceScore.toFixed(2)}
          </span>
        </p>

        {/* Network selector */}
        <div className="mb-4">
          <p className="font-outfit font-medium text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: "#6b5f50" }}>
            NETWORK
          </p>
          <div className="flex gap-2">
            {(["base", "polygon", "solana"] as Chain[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setChain(c);
                  if (c === "solana") setMethod("USDC");
                }}
                className="px-3 py-1.5 rounded text-xs font-outfit font-medium border transition-all"
                style={{
                  border: chain === c ? "1px solid #c8a96e" : "1px solid #2a2a2a",
                  color: chain === c ? "#c8a96e" : "#6b5f50",
                  background: chain === c ? "rgba(200,169,110,0.10)" : "transparent",
                }}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Solana notice */}
        {chain === "solana" && (
          <div className="mb-4 px-3 py-2 rounded text-xs font-outfit font-normal"
            style={{ background: "rgba(200,169,110,0.08)", borderLeft: "3px solid #c8a96e", color: "#c8a96e" }}>
            SolanaネットワークではUSDC決済のみご利用いただけます
          </div>
        )}

        {/* Payment method selector */}
        <div className="mb-5">
          <p className="font-outfit font-medium text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: "#6b5f50" }}>
            PAYMENT METHOD
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("USDC")}
              className="px-4 py-2 rounded text-xs font-outfit font-medium border transition-all"
              style={{
                border: method === "USDC" ? "1px solid #c8a96e" : "1px solid #2a2a2a",
                color: method === "USDC" ? "#c8a96e" : "#6b5f50",
                background: method === "USDC" ? "rgba(200,169,110,0.10)" : "transparent",
              }}
            >
              USDC {chain === "base" ? "on Base" : chain === "polygon" ? "on Polygon" : "on Solana"}
            </button>
            <button
              onClick={() => isJpycAvailable && setMethod("JPYC")}
              disabled={!isJpycAvailable}
              title={!isJpycAvailable ? "SolanaネットワークではJPYCは使用できません" : undefined}
              className="px-4 py-2 rounded text-xs font-outfit font-medium border transition-all"
              style={{
                border: !isJpycAvailable
                  ? "1px solid #2a2a2a"
                  : method === "JPYC"
                  ? "1px solid #c8a96e"
                  : "1px solid #2a2a2a",
                color: !isJpycAvailable
                  ? "#2a2a2a"
                  : method === "JPYC"
                  ? "#c8a96e"
                  : "#6b5f50",
                background: method === "JPYC" && isJpycAvailable ? "rgba(200,169,110,0.10)" : "transparent",
                opacity: !isJpycAvailable ? 0.3 : 1,
                cursor: !isJpycAvailable ? "not-allowed" : "pointer",
              }}
            >
              JPYC on Polygon
            </button>
          </div>
        </div>

        {/* Fee summary */}
        <div className="mb-4 px-3 py-2.5 rounded border" style={{ borderColor: "#2a2a2a", background: "#0a0a0a" }}>
          <div className="flex justify-between text-xs font-outfit">
            <span style={{ color: "#6b5f50" }}>Analysis fee</span>
            <span className="font-semibold tabular-nums" style={{ color: "#f5f0e8" }}>$0.30 {method}</span>
          </div>
        </div>

        {/* Wallet connect */}
        <div className="mb-4">
          <ConnectButton />
        </div>

        {/* CTA */}
        <button
          onClick={() => onPay(chain, method)}
          className="w-full py-3 rounded font-outfit font-bold text-sm transition-colors"
          style={{ background: "#c8a96e", color: "#0a0a0a" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#e8c98e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#c8a96e"; }}
        >
          承認して詳細分析 →
        </button>

        <p className="mt-4 font-outfit font-light text-xs text-center" style={{ color: "#6b5f50" }}>
          本ツールは情報提供のみを目的としています。投資判断はご自身で行ってください。
        </p>
      </div>
    </div>
  );
}
