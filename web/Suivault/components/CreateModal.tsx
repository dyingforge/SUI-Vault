import { useState } from "react";
import { TransactionModal } from "@/components/TxModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidSuiAddress } from "@mysten/sui/utils";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVault: (verifier_address: string, name: string) => void;
}

export function CreateVaultModal({ isOpen, onClose, onCreateVault }: CreateVaultModalProps) {
  const [verifierAddress, setVerifierAddress] = useState<string>('');
  const [vaultName, setVaultName] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError('验证者地址不能为空');
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
    if (!validateAddress(verifierAddress) || !vaultName) return;
    onCreateVault(verifierAddress, vaultName);
    onClose();
  };

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="创建新保险箱"
      submitButtonText="创建"
      submitDisabled={!verifierAddress || !vaultName || !!addressError}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verifier">验证者地址</Label>
          <Input
            id="verifier"
            placeholder="输入验证者 SUI 地址"
            value={verifierAddress}
            onChange={(e) => {
              setVerifierAddress(e.target.value);
              if (e.target.value) validateAddress(e.target.value);
            }}
            onBlur={() => validateAddress(verifierAddress)}
          />
          {addressError && <p className="text-sm text-red-500">{addressError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">保险箱名称</Label>
          <Input
            id="name"
            placeholder="输入保险箱名称"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
          />
        </div>
      </div>
    </TransactionModal>
  );
}