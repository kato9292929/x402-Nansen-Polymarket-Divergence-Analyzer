export const JPYC_CONTRACT = "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF"; // Polygon

export async function usdToJpyc(usdAmount: number): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=jpyc&vs_currencies=usd"
  );
  const data = await res.json();
  return Math.ceil(usdAmount / data.jpyc.usd);
}

export function formatJpyc(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`;
}
