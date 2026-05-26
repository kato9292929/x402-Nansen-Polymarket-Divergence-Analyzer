# x402 Nansen × Polymarket Divergence Analyzer

Nansenのスマートマネーフローと Polymarket の予測市場確率の**乖離を検出・分析する**リサーチターミナル。

x402 **v2** プロトコル（CAIP-2 network 識別子 / CDP Facilitator）によるマイクロペイメントで保護されたAPIエンドポイントを、EVM（Base / Polygon）および Solana チェーンで提供します。

---

## Architecture

```
Next.js 15 (App Router)
├── フロントエンド  : RainbowKit (EVM) + Solana Wallet Adapter
├── 決済           : @x402/next v2 + @x402/evm + @x402/svm (EVM & Solana)
├── Facilitator    : CDP Facilitator (CDP_API_KEY_ID + CDP_API_KEY_SECRET)
├── データソース    : Nansen API + Polymarket Gamma API
├── 分析           : Claude API (claude-sonnet-4-20250514)
└── キャッシュ      : Vercel KV / Upstash Redis
```

---

## API Endpoints

> **自律エージェント向け情報**  
> 全エンドポイントは x402 プロトコルに準拠しています。  
> `X-PAYMENT` ヘッダーなしでアクセスすると HTTP 402 と支払い要件 JSON が返ります。  
> エンドポイント一覧は `/.well-known/x402.json` からも取得できます。

### EVM エンドポイント（Base mainnet・withX402）

#### `GET /api/divergence/scan`

スマートマネーフローと予測市場確率の乖離スコア上位10トークンを返します。

| 項目 | 値 |
|---|---|
| **Price** | $0.15 USDC |
| **Network** | base-mainnet |
| **Asset** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base) |
| **Scheme** | exact |
| **Cache TTL** | 30分 |

**Query Parameters**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `chain` | `base` \| `polygon` \| `solana` | `base` | 対象チェーン |

**Response**

```json
{
  "scannedAt": "2026-05-22T10:00:00Z",
  "chain": "base",
  "results": [
    {
      "token": "ETH",
      "nansenNetFlowUsd": 12500000,
      "nansenSmartWallets": 34,
      "nansenSignal": "BULLISH",
      "polymarketMarketId": "eth-3000-june",
      "polymarketQuestion": "Will ETH be above $3000 by June?",
      "polymarketProbability": 0.31,
      "divergenceScore": 0.84,
      "divergenceType": "SMART_MONEY_BULLISH",
      "summary_ja": "スマートマネーが強気姿勢を示す一方、予測市場は弱気。乖離スコア: 0.84"
    }
  ]
}
```

---

#### `POST /api/divergence/token`

特定トークンの詳細乖離分析を Claude AI で生成します。

| 項目 | 値 |
|---|---|
| **Price** | $0.30 USDC |
| **Network** | base-mainnet |
| **Asset** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base) |
| **Scheme** | exact |
| **Cache TTL** | 15分 |

**Request Body**

```json
{
  "token": "ETH",
  "chain": "base"
}
```

**Response**

```json
{
  "divergenceScore": 0.84,
  "divergenceType": "SMART_MONEY_BULLISH",
  "analysis_ja": "スマートマネーが大規模な資金流入を継続する一方...",
  "keySignals": ["シグナル1", "シグナル2", "シグナル3"],
  "confidence": 0.78,
  "dataPoints": {
    "nansenNetFlow7d": 12500000,
    "nansenActiveSmartWallets": 34,
    "polymarketProbCurrent": 0.31,
    "polymarketProbChange7d": -0.12
  }
}
```

---

#### `GET /api/divergence/weekly`

過去7日間の乖離データを集計した週次レポート（Markdown形式・約1,500字）を返します。

| 項目 | 値 |
|---|---|
| **Price** | $1.00 USDC |
| **Network** | base-mainnet |
| **Asset** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base) |
| **Scheme** | exact |
| **Cache TTL** | 24時間 |

**Response**

```json
{
  "report": "# 週次乖離レポート\n\n## サマリー\n...",
  "generatedAt": "2026-05-22T10:00:00Z",
  "topDivergences": [ /* DivergenceResult[] */ ]
}
```

---

### Solana エンドポイント（solana-mainnet・手動402）

> **Note:** Solana エンドポイントは `withX402` を使用しません（facilitator が Solana mainnet 非対応のため）。  
> 代わりに x402 互換の 402 レスポンスを手動で返し、`X-PAYMENT` ヘッダーで決済を受け付けます。  
> JPYC は Polygon ERC-20 専用のため、Solana エンドポイントでは **USDC のみ** 利用可能です。

#### `GET /api/divergence/scan/solana`

EVM版 scan と同一ロジック。Solana チェーンのNansenデータを使用。

| 項目 | 値 |
|---|---|
| **Price** | $0.15 USDC = `150000` (6 decimals) |
| **Network** | solana-mainnet |
| **Asset** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC on Solana) |
| **Scheme** | exact |
| **payTo** | `SOLANA_WALLET_ADDRESS` 環境変数 |

**402 Response（未払い時）**

```json
{
  "error": "Payment Required",
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-mainnet",
      "maxAmountRequired": "150000",
      "resource": "https://your-app.vercel.app/api/divergence/scan/solana",
      "description": "Divergence Scan - Top 10 (Solana)",
      "mimeType": "application/json",
      "payTo": "<SOLANA_WALLET_ADDRESS>",
      "maxTimeoutSeconds": 300,
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    }
  ]
}
```

**Response（払済み時）**: EVM版 scan と同一スキーマ（`"chain": "solana"`）

---

#### `POST /api/divergence/token/solana`

EVM版 token と同一ロジック。Solana チェーン用。

| 項目 | 値 |
|---|---|
| **Price** | $0.30 USDC = `300000` (6 decimals) |
| **Network** | solana-mainnet |
| **Asset** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC on Solana) |
| **Scheme** | exact |

**Request Body**: `{ "token": "SOL" }`（`chain` フィールド不要、常に solana）

**Response**: EVM版 token と同一スキーマ

---

#### `GET /api/divergence/weekly/solana`

EVM版 weekly と同一ロジック。Solana チェーン用。

| 項目 | 値 |
|---|---|
| **Price** | $1.00 USDC = `1000000` (6 decimals) |
| **Network** | solana-mainnet |
| **Asset** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC on Solana) |
| **Scheme** | exact |

**Response**: EVM版 weekly と同一スキーマ

---

### エンドポイント一覧（機械読み取り用）

`GET /.well-known/x402.json` — 全6エンドポイントの支払い要件を一括取得できます。

---

### その他エンドポイント

| パス | 説明 |
|---|---|
| `GET /api/cron/divergence-scan` | 全チェーンのスキャン結果をKVに事前生成（Vercel Cron: 毎日0時UTC） |

---

## Divergence Score 計算式

```typescript
// Nansen net flow を -1〜1 に正規化し、Polymarket 確率との差を乖離スコアとする
function calculateDivergence(nansenNetFlow: number, polymarketProb: number): number {
  const nansenNormalized = Math.tanh(nansenNetFlow / 1_000_000);
  const nansenBullish = (nansenNormalized + 1) / 2; // 0〜1 に変換
  return Math.abs(nansenBullish - polymarketProb);
}
```

| スコア | 判定 | 表示色 |
|---|---|---|
| ≥ 0.7 | HIGH divergence | Amber `#fbbf24` |
| ≥ 0.4 | MED divergence | Gold `#c8a96e` |
| < 0.4 | LOW / ALIGNED | Green `#4ade80` |

| `divergenceType` | 条件 |
|---|---|
| `SMART_MONEY_BULLISH` | スマートマネー強気 × 予測市場弱気 |
| `SMART_MONEY_BEARISH` | スマートマネー弱気 × 予測市場強気 |
| `ALIGNED` | 両者の方向が一致（乖離 < 0.2） |

---

## Payment Matrix

| チェーン | USDC | JPYC |
|---|---|---|
| Base | ✅ | ✅ |
| Polygon | ✅ | ✅ |
| Solana | ✅ | ❌（Polygon ERC-20専用） |

JPYC コントラクト: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF` (Polygon)

---

## Environment Variables

```env
# Nansen
NANSEN_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# EVM 受取ウォレット（Base / Polygon）
WALLET_ADDRESS=0xC67d94504696960bA0f2e7C3FeE703950734c00A

# Solana 受取ウォレット（base58）
SOLANA_WALLET_ADDRESS=

# Coinbase Developer Platform (CDP) — x402 v2 production facilitator
# UUID 形式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CDP_API_KEY_ID=
# base64 形式（末尾 ==）
CDP_API_KEY_SECRET=

# Facilitator URL (x402 v2)
FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402

# アプリURL（x402 resource フィールドに使用）
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Helius RPC（Solana）
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# WalletConnect（未設定時は "placeholder" フォールバック）
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder

# JPYC（Polygon ERC-20）
NEXT_PUBLIC_JPYC_CONTRACT=0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF

# Vercel KV / Upstash Redis（Vercel Storage から自動追加）
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

---

## Setup

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build
```

---

## Tech Stack

| カテゴリ | ライブラリ |
|---|---|
| Framework | Next.js 15.5.18 (App Router) |
| 決済 | @x402/next 2.13.0 + @x402/evm + @x402/svm (v2) |
| EVM Wallet | RainbowKit 2.2.4 + wagmi 2.14.16 |
| Solana Wallet | @solana/wallet-adapter (Phantom, Solflare) |
| AI 分析 | @anthropic-ai/sdk 0.39.0 |
| キャッシュ | @vercel/kv 3.0.0 (Upstash Redis) |
| スタイル | Tailwind CSS + Outfit font |

---

## Cron

```json
{ "path": "/api/cron/divergence-scan", "schedule": "0 0 * * *" }
```

毎日UTC 0時に全チェーン（base / polygon / solana）のスキャン結果をKVに書き込みます。
有料エンドポイントを叩かずにキャッシュを温めることで、ユーザーへの初回レスポンスを高速化します。

---

## Disclaimer

本ツールは情報提供のみを目的としています。投資判断はご自身で行ってください。
