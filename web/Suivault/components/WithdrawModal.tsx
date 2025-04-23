import { useState, useEffect } from "react";
import { TransactionModal } from "@/components/TxModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuiCoin } from "@/types/index";
import { isValidSuiAddress } from "@mysten/sui/utils";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (coinType: string, amount: number, recipient: string, verificationWindow: number) => void;
  vaultBalances: { coin: string; amount: string }[];
  userAddress?: string;
}

export function WithdrawModal({ 
  isOpen, 
  onClose, 
  onWithdraw, 
  vaultBalances, 
  userAddress 
}: WithdrawModalProps) {
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>(userAddress || '');
  const [verificationWindow, setVerificationWindow] = useState<string>('60'); // 默认60分钟
  const [addressError, setAddressError] = useState<string>('');

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      if (vaultBalances.length > 0) {
        setSelectedCoin(vaultBalances[0].coin);
      }
      setAmount('');
      setRecipient(userAddress || '');
      setVerificationWindow('60');
      setAddressError('');
    }
  }, [isOpen, vaultBalances, userAddress]);

  // 验证地址
  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError('接收地址不能为空');
      return false;
    }
    if (!isValidSuiAddress(address)) {
      setAddressError('无效的 SUI 地址');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleSubmit = () => {
    if (!selectedCoin || !amount || parseFloat(amount) <= 0) return;
    if (!validateAddress(recipient)) return;
    if (!verificationWindow || parseInt(verificationWindow) <= 0) return;
    
    // 转换验证窗口时间：从分钟到链上单位(epoch)
    // 假设1个epoch大约是1分钟，可以根据实际情况调整
    const verificationWindowEpochs = parseInt(verificationWindow);
    
    onWithdraw(
      selectedCoin, 
      parseFloat(amount), 
      recipient, 
      verificationWindowEpochs
    );
    onClose();
  };

  // 获取选定代币的余额
  const getSelectedCoinBalance = () => {
    const selected = vaultBalances.find(b => b.coin === selectedCoin);
    return selected ? selected.amount : '0';
  };

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="提取资金"
      submitButtonText="提交提款请求"
      submitDisabled={
        !selectedCoin || 
        !amount || 
        parseFloat(amount) <= 0 || 
        !recipient || 
        !!addressError || 
        !verificationWindow || 
        parseInt(verificationWindow) <= 0
      }
    >
      <div className="space-y-4">
        {/* 选择代币 */}
        <div className="space-y-2">
          <Label htmlFor="asset">选择资产</Label>
          <Select
            value={selectedCoin}
            onValueChange={setSelectedCoin}
            disabled={vaultBalances.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择资产" />
            </SelectTrigger>
            <SelectContent>
              {vaultBalances.map((balance) => (
                <SelectItem key={balance.coin} value={balance.coin}>
                  {balance.coin} ({balance.amount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vaultBalances.length === 0 && (
            <p className="text-sm text-amber-600">保险箱中没有可用资产</p>
          )}
        </div>

        {/* 输入金额 */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">提取金额</Label>
            <span className="text-xs text-gray-500">
              余额: {getSelectedCoinBalance()}
            </span>
          </div>
          <Input
            id="amount"
            placeholder="输入金额"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* 接收地址 */}
        <div className="space-y-2">
          <Label htmlFor="recipient">接收地址</Label>
          <Input
            id="recipient"
            placeholder="输入接收地址"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              if (e.target.value) validateAddress(e.target.value);
            }}
            onBlur={() => validateAddress(recipient)}
          />
          {addressError && <p className="text-sm text-red-500">{addressError}</p>}
          <p className="text-xs text-gray-500">默认为当前连接的钱包地址</p>
        </div>

        {/* 验证窗口时间 */}
        <div className="space-y-2">
          <Label htmlFor="verification-window">验证等待时间 (分钟)</Label>
          <Input
            id="verification-window"
            placeholder="输入验证等待时间"
            type="number"
            min="1"
            value={verificationWindow}
            onChange={(e) => setVerificationWindow(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            设置验证人最长响应时间，超时后可自动取消交易
          </p>
        </div>
      </div>
    </TransactionModal>
  );
}