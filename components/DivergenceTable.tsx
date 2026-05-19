"use client";

import { DivergenceResult, DivergenceType } from "@/lib/divergence";

interface Props {
  data: DivergenceResult[];
  onAnalyze: (result: DivergenceResult) => void;
}

function getDivergenceBadge(type: DivergenceType) {
  switch (type) {
    case "SMART_MONEY_BULLISH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-outfit font-medium"
          style={{ background: "rgba(200,169,110,0.12)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.35)" }}>
          🟢 SMART_MONEY_BULLISH
        </span>
      );
    case "SMART_MONEY_BEARISH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-outfit font-medium"
          style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.35)" }}>
          🔴 SMART_MONEY_BEARISH
        </span>
      );
    case "ALIGNED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-outfit font-medium"
          style={{ background: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" }}>
          ⚪ ALIGNED
        </span>
      );
  }
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return "#fbbf24";
  if (score >= 0.4) return "#c8a96e";
  return "#4ade80";
}

export function DivergenceTable({ data, onAnalyze }: Props) {
  return (
    <div className="overflow-x-auto border border-[#2a2a2a] rounded" style={{ background: "#0a0a0a" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #2a2a2a", background: "#0a0a0a" }}>
            {["TOKEN", "NANSEN SIGNAL", "POLYMARKET PROB", "DIVERGENCE SCORE", "TYPE", "ACTION"].map((col) => (
              <th key={col} className="px-4 py-3 text-left font-outfit font-medium text-[10px] uppercase tracking-[0.15em]"
                style={{ color: "#6b5f50" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.token}
              className={`transition-colors ${row.divergenceScore > 0.7 ? "high-divergence" : ""}`}
              style={{
                background: i % 2 === 0 ? "#0a0a0a" : "#111111",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <td className="px-4 py-3.5">
                <span className="font-outfit font-bold text-base" style={{ color: "#f5f0e8" }}>{row.token}</span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-outfit font-semibold text-xs"
                    style={{ color: row.nansenSignal === "BULLISH" ? "#4ade80" : row.nansenSignal === "BEARISH" ? "#f87171" : "#94a3b8" }}>
                    {row.nansenSignal}
                  </span>
                  <span className="font-outfit font-light text-xs" style={{ color: "#6b5f50" }}>
                    ${(row.nansenNetFlowUsd / 1_000_000).toFixed(1)}M | {row.nansenSmartWallets}w
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-1">
                  <span className="font-outfit font-semibold text-sm tabular-nums" style={{ color: "#f5f0e8" }}>
                    {(row.polymarketProbability * 100).toFixed(0)}%
                  </span>
                  <div className="h-0.5 w-16 rounded-full" style={{ background: "#2a2a2a" }}>
                    <div
                      className="h-0.5 rounded-full"
                      style={{ width: `${row.polymarketProbability * 100}%`, background: "#c8a96e" }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-outfit font-semibold text-2xl tabular-nums"
                  style={{ color: getScoreColor(row.divergenceScore) }}>
                  {row.divergenceScore.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3.5">{getDivergenceBadge(row.divergenceType)}</td>
              <td className="px-4 py-3.5">
                {row.divergenceScore > 0.3 ? (
                  <button
                    onClick={() => onAnalyze(row)}
                    className="px-3 py-1.5 rounded text-xs font-outfit font-medium transition-all"
                    style={{
                      border: "1px solid #c8a96e",
                      color: "#c8a96e",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#c8a96e";
                      e.currentTarget.style.color = "#0a0a0a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#c8a96e";
                    }}
                  >
                    詳細分析
                  </button>
                ) : (
                  <span className="text-xs font-outfit" style={{ color: "#2a2a2a" }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
