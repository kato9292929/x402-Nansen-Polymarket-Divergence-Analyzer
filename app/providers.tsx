"use client";

import dynamic from "next/dynamic";

const WalletProviders = dynamic(
  () => import("./wallet-providers").then((m) => m.WalletProviders),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProviders>{children}</WalletProviders>;
}
