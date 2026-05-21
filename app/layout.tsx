import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SolanaProvidersWrapper } from "./solana-providers-wrapper";

export const metadata: Metadata = {
  title: "x402 Divergence Analyzer | Nansen × Polymarket",
  description: "Nansenのスマートマネー × Polymarketの予測市場 — 乖離を検出する",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <SolanaProvidersWrapper>
            {children}
          </SolanaProvidersWrapper>
        </Providers>
      </body>
    </html>
  );
}
