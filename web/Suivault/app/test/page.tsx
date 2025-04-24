"use client"

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, Activity, Lock, Coins, CheckCircle } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiAddress } from "@mysten/sui/utils";

// 导入公共工具和函数
import { formatAmount, formatTimestamp } from "@/lib/utils";
import { queryUserVault, getVaultDynamicFields, queryRequestEvent } from "@/contracts/query";
import { vaultConstants } from "@/lib/constants";

// 导入子组件
import DashboardView from "@/components/dashboard/DashboardView";
import VaultsManagementView from "@/components/vaults/VaultsManagementView";
import VaultOperationsView from "@/components/vault-operations/VaultOperationsView";
import ValidatorConsoleView from "@/components/validator/ValidatorConsoleView";
import NotificationCenterView from "@/components/notifications/NotificationCenterView";
import {CreateVaultModal} from "@/components/CreateModal";
import { UserVault, DispalyVault, VaultData, VerificationRequested } from "@/types/index";


import { useVaultTransactions } from "@/hooks/useVaultTransactions";

export default function VaultDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const currentUser = useCurrentAccount();
  
  const [userVaults, setUserVaults] = useState<UserVault | null>(null);
  const [selectedVault, setSelectedVault] = useState<DispalyVault | null>(null);
  const [vaultDatas, setVaultDatas] = useState<VaultData[] | null>(null);
  const [requests, setRequests] = useState<VerificationRequested[] | null>(null);

  const {
    handleCreateVault,
    handleRelock,
    handleDepositCoin,
    handleWithdrawCoin,
    handleInitiateEmergencyUnlock,
    handleExecuteEmergencyUnlock,
    handleCancelEmergencyUnlock,
    handleVerifyAndWithdraw
  } = useVaultTransactions(currentUser, selectedVault!);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentUser?.address && isValidSuiAddress(currentUser?.address)) {
          const event = await queryRequestEvent();
          setRequests(event);
          
          const userVaults = await queryUserVault(currentUser?.address);
          setUserVaults(userVaults);
          
          if (userVaults?.user_vaults[0]) {
            const vaultData = await getVaultDynamicFields(userVaults.user_vaults[0].id.id);
            setVaultDatas(vaultData);
          }
        }
      } catch (error) { 
        console.error("Error fetching vault data:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  const data = vaultDatas?.map((balance) => ({
    coin: balance.name.split("::").pop() || "SUI",
    amount: balance.value
  }));

  const vaults = userVaults?.user_vaults.map((vault) => ({
    id: vault.id,
    name: vault.name,
    status: vault.status,
    createdAt: formatTimestamp(vault.created_at),
    verifier: vault.verifier_address,
    balances: data?.map(item => ({
      coin: item.coin,
      amount: String(item.amount)
    })) || [],
    emergencyTimeRemaining: `${vault.emergency_unlock_time}天`,
  })) as DispalyVault[] || [];

  const handleVaultSelected = (vaultId: string) => {
    const selectedVault = vaults.find(v => v.id.id === vaultId);
    if (selectedVault) {
      setSelectedVault(selectedVault);
      setTab("vault");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">SuiVault</h1>
        <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
      </div>
      
      <Tabs defaultValue="dashboard" value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            <Activity className="mr-2 h-4 w-4" />仪表盘
          </TabsTrigger>
          <TabsTrigger value="vaults" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            <Lock className="mr-2 h-4 w-4" />保险箱管理
          </TabsTrigger>
          <TabsTrigger value="vault" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            <Coins className="mr-2 h-4 w-4" />保险箱操作
          </TabsTrigger>
          <TabsTrigger value="validator" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            <CheckCircle className="mr-2 h-4 w-4" />验证者控制台
          </TabsTrigger>
          <TabsTrigger value="center" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            <Bell className="mr-2 h-4 w-4" />通知与交易
          </TabsTrigger>
        </TabsList>

        {/* 主仪表盘 */}
        <TabsContent value="dashboard">
          <DashboardView 
            vaults={vaults} 
            data={data} 
            onCreateVault={() => setShowCreateVaultModal(true)}
          />
        </TabsContent>

        {/* 保险箱管理 */}
        <TabsContent value="vaults">
          <VaultsManagementView 
            vaults={vaults} 
            onVaultSelect={handleVaultSelected} 
            onCreateVault={() => setShowCreateVaultModal(true)}
          />
        </TabsContent>

        {/* 保险箱操作 */}
        <TabsContent value="vault">
          <VaultOperationsView
            currentUser={currentUser}
            selectedVault={selectedVault}
            vaultData={data}
            onDeposit={handleDepositCoin}
            onWithdraw={handleWithdrawCoin}
            onRelock={handleRelock}
            onInitiateEmergencyUnlock={handleInitiateEmergencyUnlock}
            onExecuteEmergencyUnlock={handleExecuteEmergencyUnlock}
            onCancelEmergencyUnlock={handleCancelEmergencyUnlock}
          />
        </TabsContent>

        {/* 验证者控制台 */}
        <TabsContent value="validator">
          <ValidatorConsoleView 
            currentUser={currentUser} 
            requests={requests} 
            onVerifyAndWithdraw={handleVerifyAndWithdraw}
            onRelock={handleRelock}
          />
        </TabsContent>

        {/* 通知与交易中心 */}
        <TabsContent value="center">
          <NotificationCenterView />
        </TabsContent>
      </Tabs>

      <CreateVaultModal
        isOpen={showCreateVaultModal}
        onClose={() => setShowCreateVaultModal(false)}
        onCreateVault={handleCreateVault}
      />
    </div>
  );
}