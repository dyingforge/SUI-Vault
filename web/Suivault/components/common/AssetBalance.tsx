import { formatAmount } from "@/lib/utils";

interface AssetBalanceProps {
  coin: string;
  amount: string | number;
  showSymbol?: boolean;
}

export default function AssetBalance({ coin, amount, showSymbol = true }: AssetBalanceProps) {
  const symbol = coin.split("::").pop() || coin;
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{symbol} 余额</span>
      <span className="text-sm font-medium">
        {formatAmount(amount)} {showSymbol ? symbol : ''}
      </span>
    </div>
  );
}