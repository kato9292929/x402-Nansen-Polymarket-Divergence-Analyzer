import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // x402 v2 packages are ESM-only and import "next/server" as a bare directory
  // specifier. Transpiling them through webpack resolves the module correctly
  // without hitting the Vercel Edge Function 1 MB limit (API routes run on
  // Node.js lambdas, not Edge).
  transpilePackages: ["@x402/next", "@x402/core", "@x402/evm", "@x402/svm", "@coinbase/x402"],
  webpack: (config) => {
    // pino-pretty is an optional dependency pulled in transitively by
    // WalletConnect logging; mark it external to suppress the build warning.
    config.externals = [...(config.externals ?? []), "pino-pretty"];
    return config;
  },
};

export default nextConfig;
