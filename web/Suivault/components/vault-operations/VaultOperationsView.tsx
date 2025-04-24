import { Badge } from "@/components/ui/badge";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawModal } from "@/components/WithdrawModal";
import VaultDetailsCard from "./VaultDetailsCard";
import AssetManagementCard from "./AssetManagementCard";
import SecurityControlCard from "./SecurityControlCard";
import TransactionHistoryCard from "./TransactionHistoryCard";
import { DispalyVault } from "@/types/index";
import { useState } from "react";

interface VaultOperationsViewProps {
  currentUser: any;
  selectedVault: DispalyVault | null;
  vaultData: any[] | undefined;
  onDeposit: (asset: any, amount: number) => void;
  onWithdraw: (coinType: string, amount: number, recipient: string, verificationWindow: number) => void;
  onRelock: () => void;
  onInitiateEmergencyUnlock: () => void;
  onExecuteEmergencyUnlock: () => void;
  onCancelEmergencyUnlock: () => void;
}

export default function VaultOperationsView({
  currentUser,
  selectedVault,
  vaultData,
  onDeposit,
  onWithdraw,
  onRelock,
  onInitiateEmergencyUnlock,
  onExecuteEmergencyUnlock,
  onCancelEmergencyUnlock
}: VaultOperationsViewProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">保险箱操作界面</h2>
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          name: {selectedVault?.name}
        </Badge>
      </div>

      <VaultDetailsCard 
        vault={selectedVault} 
        userAddress={currentUser?.address} 
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <AssetManagementCard 
          vault={selectedVault} 
          data={vaultData}
          onDepositClick={() => setShowDepositModal(true)}
          onWithdrawClick={() => setShowWithdrawModal(true)}
        />

        <SecurityControlCard 
          vault={selectedVault}
          onRelock={onRelock}
          onInitiateEmergencyUnlock={onInitiateEmergencyUnlock}
          onExecuteEmergencyUnlock={onExecuteEmergencyUnlock}
          onCancelEmergencyUnlock={onCancelEmergencyUnlock}
        />
      </div>

      <TransactionHistoryCard />

      {/* 模态框 */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={onDeposit}
        userAddress={currentUser?.address}
      />
      
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={onWithdraw}
        vaultBalances={selectedVault?.balances || []}
        userAddress={currentUser?.address}
      />
    </div>
  );
}