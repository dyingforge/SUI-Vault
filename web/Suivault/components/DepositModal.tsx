import { useState, useEffect } from "react";
import { TransactionModal } from "./TxModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserProfileCoin } from "@/contracts/query";
import { SuiCoin } from "@/types/index";
import { isValidSuiAddress } from "@mysten/sui/utils";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (asset: SuiCoin, amount: number) => void;
  userAddress?: string;
}

export function DepositModal({ isOpen, onClose, onDeposit, userAddress }: DepositModalProps) {
  const [assets, setAssets] = useState<SuiCoin[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SuiCoin | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!userAddress || !isValidSuiAddress(userAddress)) return;
      
      setLoading(true);
      try {
        const coins = await getUserProfileCoin(userAddress);
        setAssets(coins || []);
        if (coins && coins.length > 0) {
          setSelectedAsset(coins[0]);
        }
      } catch (error) {
        console.error("获取用户资产失败", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchUserAssets();
    }
  }, [isOpen, userAddress]);

  const handleSubmit = () => {
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) return;
    onDeposit(selectedAsset, parseFloat(amount));
    onClose();
  };

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="存入资金"
      submitButtonText="存入"
      submitDisabled={!selectedAsset || !amount || parseFloat(amount) <= 0 || loading}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="asset">选择资产</Label>
          <Select
            disabled={loading}
            value={selectedAsset?.type || ''}
            onValueChange={(value) => {
              const asset = assets.find(a => a.type === value);
              if (asset) setSelectedAsset(asset);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择资产" />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.type} value={asset.type}>
                  {asset.coinMetadata?.symbol || asset.type} ({asset.balance})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">存入金额</Label>
            {selectedAsset && (
              <span className="text-xs text-gray-500">
                余额: {selectedAsset.balance} {selectedAsset.coinMetadata?.symbol}
              </span>
            )}
          </div>
          <Input
            id="amount"
            placeholder="输入金额"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
    </TransactionModal>
  );
}