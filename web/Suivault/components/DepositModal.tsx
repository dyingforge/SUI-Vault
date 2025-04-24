import { useState, useEffect } from "react";
import { TransactionModal } from "./TxModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserProfileCoin } from "@/contracts/query";
import { SuiCoin } from "@/types/index";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet } from "lucide-react";

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

  const formatAmount = (amount: string | number | undefined, decimals: number = 2): string => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (value ? value / 1000000000 : 0).toFixed(decimals);
  };

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
      setAmount(''); // 重置金额
    }
  }, [isOpen, userAddress]);

  const handleSubmit = () => {
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) return;
    onDeposit(selectedAsset, parseFloat(amount));
    onClose();
  };
  
  // 添加最大金额按钮功能
  const handleMaxAmount = () => {
    if (selectedAsset) {
      // 转换为UI显示单位
      const maxValue = Number(selectedAsset.balance) / 1000000000;
      setAmount(maxValue.toString());
    }
  };

  // 获取代币符号
  const getSymbol = (asset: SuiCoin) => {
    return asset.coinMetadata?.symbol || asset.type.split('::').pop() || 'SUI';
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
      <div className="space-y-5">
        {/* 资产选择区域 */}
        <div className="space-y-2">
          <Label htmlFor="asset" className="text-sm font-medium">选择资产</Label>
          <Select
            disabled={loading}
            value={selectedAsset?.type || ''}
            onValueChange={(value) => {
              const asset = assets.find(a => a.type === value);
              if (asset) setSelectedAsset(asset);
            }}
          >
            <SelectTrigger className="bg-white dark:bg-gray-800 border-2 focus:ring-blue-500 h-11">
              <SelectValue placeholder="选择要存入的资产" />
            </SelectTrigger>
            <SelectContent>
              {assets.length > 0 ? assets.map((asset) => (
                <SelectItem key={asset.type} value={asset.type} className="py-3">
                  <div className="flex justify-between w-full items-center">
                    <span className="font-medium">{getSymbol(asset)}</span>
                    <span className="text-gray-500 text-sm">
                      {formatAmount(asset.balance)} {getSymbol(asset)}
                    </span>
                  </div>
                </SelectItem>
              )) : (
                <SelectItem value="loading" disabled className="text-center">
                  {loading ? "加载中..." : "没有可用资产"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 金额输入区域 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="amount" className="text-sm font-medium">存入金额</Label>
            {selectedAsset && (
              <div className="flex items-center text-sm text-gray-500">
                <Wallet className="h-3.5 w-3.5 mr-1" />
                <span>
                  可用: <span className="font-medium">{formatAmount(selectedAsset.balance)}</span> {getSymbol(selectedAsset)}
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20 h-11 text-lg font-medium bg-white dark:bg-gray-800 border-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button 
                type="button" 
                variant="ghost" 
                className="h-full px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm"
                onClick={handleMaxAmount}
                disabled={!selectedAsset}
              >
                MAX
              </Button>
            </div>
          </div>
        </div>

        {/* 预览区域 */}
        {selectedAsset && amount && parseFloat(amount) > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">将存入保险箱</span>
              <div className="flex items-center text-blue-700 dark:text-blue-400 font-medium">
                {amount} {getSymbol(selectedAsset)}
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </TransactionModal>
  );
}