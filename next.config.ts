import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // x402-next is transpiled (not bundled as server-external) so webpack resolves
  // next/server correctly. API routes run on Node.js runtime (not Edge), so
  // the 1MB Edge Function limit does not apply here.
  transpilePackages: ["x402-next"],
};
export default nextConfig;
