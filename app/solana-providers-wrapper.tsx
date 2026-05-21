"use client";

import dynamic from "next/dynamic";

const SolanaWalletProviders = dynamic(
  () => import("@/components/SolanaWalletProviders"),
  { ssr: false }
);

export function SolanaProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <SolanaWalletProviders>{children}</SolanaWalletProviders>;
}
