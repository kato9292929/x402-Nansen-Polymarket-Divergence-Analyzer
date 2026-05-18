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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-900/40 text-blue-300 border border-blue-700/40">
          🟢 SMART_MONEY_BULLISH
        </span>
      );
    case "SMART_MONEY_BEARISH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-red-900/40 text-red-300 border border-red-700/40">
          🔴 SMART_MONEY_BEARISH
        </span>
      );
    case "ALIGNED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-gray-800/40 text-gray-400 border border-gray-700/40">
          ⚪ ALIGNED
        </span>
      );
  }
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return "text-red-400";
  if (score >= 0.4) return "text-yellow-400";
  return "text-green-400";
}

function getHeatmapBg(score: number): string {
  if (score >= 0.7) return "bg-red-900/20";
  if (score >= 0.4) return "bg-yellow-900/20";
  return "bg-green-900/10";
}

export function DivergenceTable({ data, onAnalyze }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-900/50">
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">TOKEN</th>
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">NANSEN SIGNAL</th>
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">POLYMARKET PROB</th>
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">DIVERGENCE SCORE</th>
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">TYPE</th>
            <th className="px-4 py-3 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((row) => (
            <tr
              key={row.token}
              className={`${getHeatmapBg(row.divergenceScore)} transition-colors hover:bg-slate-800/30 ${row.divergenceScore > 0.7 ? "high-divergence" : ""}`}
            >
              <td className="px-4 py-3">
                <span className="font-mono font-bold text-white">{row.token}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className={`font-mono text-xs font-semibold ${row.nansenSignal === "BULLISH" ? "text-blue-400" : row.nansenSignal === "BEARISH" ? "text-red-400" : "text-slate-400"}`}>
                    {row.nansenSignal}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    ${(row.nansenNetFlowUsd / 1_000_000).toFixed(1)}M | {row.nansenSmartWallets}w
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-slate-200">
                    {(row.polymarketProbability * 100).toFixed(0)}%
                  </span>
                  <div className="mt-1 h-1 w-16 rounded bg-slate-700">
                    <div
                      className="h-1 rounded bg-blue-500"
                      style={{ width: `${row.polymarketProbability * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`font-mono text-2xl font-bold ${getScoreColor(row.divergenceScore)}`}>
                  {row.divergenceScore.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3">{getDivergenceBadge(row.divergenceType)}</td>
              <td className="px-4 py-3">
                {row.divergenceScore > 0.3 ? (
                  <button
                    onClick={() => onAnalyze(row)}
                    className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-blue-600/20 text-blue-300 border border-blue-600/40 hover:bg-blue-600/40 transition-colors"
                  >
                    詳細分析
                  </button>
                ) : (
                  <span className="text-xs text-slate-600 font-mono">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
