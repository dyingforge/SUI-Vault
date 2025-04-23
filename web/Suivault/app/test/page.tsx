"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { DepositModal } from "@/components/DepositModal";
import { Bell, Plus, Lock, Unlock, History, Activity, Wallet, Search, ArrowUpRight, ArrowDownLeft, Coins, CheckCircle, XCircle, Calendar } from "lucide-react";
import {  useState,useEffect, use } from "react";
import {queryUserVault,getVaultDynamicFields,queryRequestEvent} from "@/contracts/query";
import {createVaultTx,relockTx,depositCoinTx,verifyAndWithdrawTx,requestVerificationTx,initiateEmergencyUnlockTx,executeEmergencyUnlockTx,cancelEmergencyUnlockTx} from "@/contracts/vault";
import {useBetterSignAndExecuteTransaction} from "@/hooks/useBetterTx";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectButton} from "@mysten/dapp-kit";
import { isValidSuiAddress } from "@mysten/sui/utils";
import {UserVault,DispalyVault,SuiCoin,VaultData,VerificationRequested } from "@/types/index";
import { WithdrawModal } from "@/components/WithdrawModal";
import { CreateVaultModal } from "@/components/CreateModal";


export default function VaultDashboard() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const currentUser = useCurrentAccount();
  const [tab, setTab] = useState("dashboard");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { handleSignAndExecuteTransaction:createVault } = useBetterSignAndExecuteTransaction({tx:createVaultTx});
  const { handleSignAndExecuteTransaction:relockVault } = useBetterSignAndExecuteTransaction({tx:relockTx});
  const {handleSignAndExecuteTransaction:verifyAndWithdraw} = useBetterSignAndExecuteTransaction({tx:verifyAndWithdrawTx});
  const {handleSignAndExecuteTransaction:depositCoin } = useBetterSignAndExecuteTransaction({tx:depositCoinTx});
  const {handleSignAndExecuteTransaction:withdrawCoin} = useBetterSignAndExecuteTransaction({tx:requestVerificationTx})
  const {handleSignAndExecuteTransaction:initiateEmergencyUnlock} = useBetterSignAndExecuteTransaction({tx:initiateEmergencyUnlockTx});
  const {handleSignAndExecuteTransaction:executeEmergencyUnlock} = useBetterSignAndExecuteTransaction({tx:executeEmergencyUnlockTx});
  const {handleSignAndExecuteTransaction:cancelEmergencyUnlock} = useBetterSignAndExecuteTransaction({tx:cancelEmergencyUnlockTx});
  const [userVaults, setUserVaults] = useState<UserVault>() || [];
  const [selectedVault, setSelectedVault] = useState<DispalyVault | null>(null);
  const [vaultDatas,setVaultDatas] = useState<VaultData[]>() || []
  const [requests,setRequests] = useState<VerificationRequested[]>() || []

  const VAULT_LOCKED: number = 0;
  const VAULT_PENDING_VERIFICATION: number = 1;
// const VAULT_VERIFIED: u8 = 2;
  const VAULT_EMERGENCY_PENDING: number = 3;
// const VAULT_TEMP_UNLOCKED: u8 = 4;

useEffect(() => {
  const fetchData = async () => {
    try {
      if (currentUser?.address && isValidSuiAddress(currentUser?.address)) {
      // setCap(cap);
      const event = await queryRequestEvent();
      setRequests(event);
      const userVaults = await queryUserVault(currentUser?.address);
      setUserVaults(userVaults);
      const vaultData = await getVaultDynamicFields(userVaults?.user_vaults[0].id.id);
      setVaultDatas(vaultData);
      }
    } catch (error) { 
      console.error("Error fetching vault data:", error);
    }
  };
  fetchData();
}, [currentUser]);

const handleVaultSelected = (vaultId: string) => {
  // 在保险箱列表中找到匹配的保险箱
  const selectedVault = vaults.find(v => v.id.id === vaultId);
  if (selectedVault) {
    // 设置选中的保险箱
    setSelectedVault(selectedVault);
    // 自动切换到保险箱操作标签页
    setTab("vault");
  }
};

const handleRelock = async () => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  relockVault({vault: selectedVault.id.id}).onSuccess(async (result) => {
    console.log("锁定成功", result);
    // 可以添加提示或刷新数据
  }).onError(async (error) => {
    console.error("锁定失败", error);
    // 可以添加错误提示
  }).execute();
};

const handleVerifyAndWithdraw = async (vaultId: string,cap:string,coin_type:string) => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address)) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  } 
  console.log("ddd",vaultId,cap,coin_type)
  verifyAndWithdraw({vault:vaultId,cap:cap,coin_type:coin_type}).onSuccess(async (result) => {
    console.log("提款请求交易成功:", result);
    // 可以添加提示或刷新数据
  })
  .onError(async (error) => {
    console.error("提款请求交易错误:", error);
    // 可以添加错误提示
  })
  .execute();
}

const handleCreateVault = async (verifier_address:string, name:string) => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address)) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  createVault({verifier_address:verifier_address,name:name}).onSuccess(async (result) =>{
    console.log("创建成功",result)
    }).onError(async (e) => {
      console.log("创建失败",e);
  }).execute();

};

const handleWithdrawCoin = async (
  coinType: string, 
  amount: number, 
  recipient: string, 
  verificationWindow: number
) => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }

    const coinAmount = Math.floor(amount * 10 ** 9);
    withdrawCoin({
      vault: selectedVault.id.id,
      amount: coinAmount,
      recipient: recipient,
      verification_window: verificationWindow,
      coin_type: coinType,
    })
    .onSuccess(async (result) => {
      console.log("提款请求交易成功:", result);
      // 可以添加提示或刷新数据
    })
    .onError(async (error) => {
      console.error("提款请求交易错误:", error);
      // 可以添加错误提示
    })
    .execute();
};


const handleDepositCoin = async (asset: SuiCoin, amount: number) => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
    // 计算实际金额（考虑小数位）
    const coinAmount = Math.floor(amount * 10 ** (asset.coinMetadata?.decimals || 0));
    console.log("开始存款交易:", {
      vault: selectedVault.id.id,
      coin: asset.id,
      amount: coinAmount,
      coin_type: asset.type
    });
    
    depositCoin({
      vault: selectedVault.id.id,
      coin: asset.id,
      amount: coinAmount,
      coin_type: asset.type,
    })
    .onSuccess(async (result) => {
      console.log("存款交易成功:", result);
      // 可以添加提示或刷新数据
    })
    .onError(async (error) => {
      console.error("存款交易错误:", error);
      // 可以添加错误提示
    })
    .execute();
};

const handleInitiateEmergencyUnlock = async () => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  initiateEmergencyUnlock({
    vault: selectedVault.id.id,
  })
  .onSuccess(async (result) => {
    console.log("紧急解锁交易成功:", result);
    // 可以添加提示或刷新数据
  }).onError(async (error) => {
    console.error("紧急解锁交易错误:", error);
    // 可以添加错误提示
  }).execute();
}

const handleRelockVault = async () => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  relockVault({
    vault: selectedVault.id.id,
  }).execute();
}
const handleCancelEmergencyUnlock = async () => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  cancelEmergencyUnlock({
    vault: selectedVault.id.id,
  }).execute();
}

const handleExecuteEmergencyUnlock = async (recipient:string) => {
  if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
    console.error("缺少必要参数：用户地址或保险箱");
    return;
  }
  executeEmergencyUnlock({
    vault: selectedVault.id.id,
    recipient: recipient,
    coin_type: selectedVault.balances.map((item) => item.coin),
  }).execute();
}

  const data = vaultDatas?.map((banlance) => ({
    coin:  banlance.name.split("::").pop() || "SUI"
,
    amount:banlance.value
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  const vaults = userVaults?.user_vaults.map((vault, index) => ({
    id: vault.id,
    name:vault.name,
    status: vault.status,
    createdAt: new Date(vault.created_at * 1000).toLocaleDateString(),
    verifier: vault.verifier_address,
    balances: data?.map(item => ({
      coin: item.coin,
      amount: String(item.amount) // 转换为字符串
    })) || [],
    emergencyTimeRemaining: `${vault.emergency_unlock_time}天`,
  }))as DispalyVault[] || [];
  
  const getStatusText = (status: number): string => {
    switch (status) {
      case VAULT_LOCKED:
        return '已锁定';
      case VAULT_EMERGENCY_PENDING:
        return '紧急解锁中';
      case VAULT_PENDING_VERIFICATION:
        return '验证中';
      default:
        return '未知状态';
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
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">钱包连接</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">连接您的 SUI 钱包</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <ConnectButton className="w-full" />
              </CardFooter>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">保险箱总览</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">保险箱数</span>
                    <Badge variant="outline">{vaults.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">总资产</span>
                    <span className="font-medium">{(vaults.reduce((total, vault) => total + vault.balances.reduce((sum, balance) => sum + parseFloat(balance.amount), 0), 0) / 1000000000).toFixed(2)}  SUI </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full"  onClick={() => setShowCreateVaultModal(true)} >
                  <Plus className="mr-2 h-4 w-4" /> 创建新保险箱
                </Button>
              </CardFooter>
            </Card>
            <CreateVaultModal
        isOpen={showCreateVaultModal}
        onClose={() => setShowCreateVaultModal(false)}
        onCreateVault={handleCreateVault}
      />
            
            <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">资产分布</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter>
                <div className="flex justify-around w-full">
                  {data?.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-xs">{entry.coin}</span>
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                最近活动与通知
                <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                    <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">转账成功</p>
                    <p className="text-xs text-gray-500">2025-04-20 14:30</p>
                  </div>
                  <Badge>+¥500</Badge>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">保险箱创建完成</p>
                    <p className="text-xs text-gray-500">2025-04-19 10:15</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8">查看</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 保险箱管理 */}
        <TabsContent value="vaults" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold">我的保险箱</h2>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">共 {vaults.length} 个</Badge>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10 w-[250px]" placeholder="搜索保险箱..." />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> 创建保险箱
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault, index) => (
              <Card key={index} className={`border-l-4 ${
                vault.status === VAULT_EMERGENCY_PENDING ? 'border-amber-500' : 
                index === 0 ? 'border-blue-500' : 'border-purple-500'
              } shadow-sm hover:shadow-md transition-all`}
              onClick={() => handleVaultSelected(vault.id.id)}  // 添加点击事件
>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg font-medium">{vault.name}</CardTitle>
                    <Badge 
                      className={vault.status === VAULT_LOCKED 
                        ? 'bg-gray-100 text-gray-800' 
                        : vault.status === VAULT_EMERGENCY_PENDING
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'}>
                      {getStatusText(vault.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">创建于 {vault.createdAt}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">验证者</span>
                      <span className="text-sm font-medium truncate max-w-[180px]">{vault.verifier}</span>
                    </div>
                    {vault.balances.map((balance, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-sm text-gray-500">{balance.coin} 余额</span>
                        <span className="text-sm font-medium">{balance.amount}</span>
                      </div>
                    ))}
                    {vault.status === VAULT_EMERGENCY_PENDING && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-600">紧急倒计时</span>
                        <span className="text-sm font-medium bg-amber-50 px-2 py-1 rounded">
                          {vault.emergencyTimeRemaining}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant={vault.status === VAULT_EMERGENCY_PENDING ? 'outline' : 'outline'} 
                    className={`w-full ${
                      vault.status === VAULT_EMERGENCY_PENDING
                        ? 'text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100' 
                        : ''
                    }`}>
                    {vault.status === VAULT_EMERGENCY_PENDING
                      ? <><Calendar className="mr-2 h-4 w-4" />管理紧急状态</>
                      : <><Unlock className="mr-2 h-4 w-4" />管理</>
                    }
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 保险箱操作 */}
        <TabsContent value="vault" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">保险箱操作界面</h2>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">name: {selectedVault?.name}</Badge>
          </div>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">
                保险箱详情
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">所有者</span>
                <span className="text-sm font-medium truncate max-w-[180px]">{currentUser?.address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">验证者</span>
                <span className="text-sm font-medium truncate max-w-[180px]">{selectedVault?.verifier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm font-medium">{selectedVault?.createdAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">状态</span>
                <Badge className="bg-gray-100 text-gray-800">{
                getStatusText(selectedVault?.status || 1)}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">资产管理</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
              <div className="space-y-3">
                      {data && data.length > 0 ? (
                        data.map((asset, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{asset.coin} 余额</span>
                            <span className="text-sm font-medium">{(asset.amount / 1000000000).toFixed(4)} {asset.coin.split("::").pop()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-gray-500">
                          <p className="text-sm">此保险箱暂无资产</p>
                        </div>
                      )}
                    </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="flex items-center justify-center" onClick={() => setShowDepositModal(true)}     disabled={!selectedVault}
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" /> 存款
                </Button>
                <Button variant="outline" className="flex items-center justify-center"   onClick={() => setShowWithdrawModal(true) }  disabled={!selectedVault}

                >
                  <ArrowUpRight className="mr-2 h-4 w-4" /> 提款
                </Button>
              </CardFooter>
            </Card>
            <DepositModal
                isOpen={showDepositModal}
                  onClose={() => setShowDepositModal(false)}
                 onDeposit={handleDepositCoin}
                  userAddress={currentUser?.address}
                  />
                <WithdrawModal
                  isOpen={showWithdrawModal}
                  onClose={() => setShowWithdrawModal(false)}
                  onWithdraw={handleWithdrawCoin}
                  vaultBalances={selectedVault?.balances || []}
                  userAddress={currentUser?.address}
                />
      
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">安全控制</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">保险箱锁定状态可以通过以下操作来管理。紧急解锁将在7天后自动执行。</p>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700" onClick={handleRelock} disabled={!selectedVault}>
                  <Lock className="mr-2 h-4 w-4" /> 锁定
                </Button>
                <Button className="flex items-center justify-center" onClick={handleInitiateEmergencyUnlock} disabled={!selectedVault}>
                  <Unlock className="mr-2 h-4 w-4" /> 解锁
                </Button>
                <Button variant="destructive" className="col-span-2 flex items-center justify-center"  disabled={!selectedVault}>
                  <XCircle className="mr-2 h-4 w-4" /> 紧急解锁
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">交易记录</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 mt-2">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                    <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">存款</p>
                    <p className="text-xs text-gray-500">2025-04-20 14:30</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">+1000 SUI</Badge>
                </div>

                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
                    <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">提款</p>
                    <p className="text-xs text-gray-500">2025-04-19 10:15</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">-500 SUI</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 验证者控制台 */}
        <TabsContent value="validator" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">验证者控制台</h2>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">当前角色: 验证者</Badge>
          </div>

          {/* 添加过滤逻辑 */}
          {(() => {
            // 过滤当前用户作为验证者的请求
            const filteredRequests = requests?.filter(request => 
              request.verifier.toLowerCase() === currentUser?.address?.toLowerCase()
            ) || [];

            return (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                    待处理验证请求
                    <Badge className="bg-amber-100 text-amber-800">{filteredRequests.length} 个待处理</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-4 mt-2">
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p>没有待处理的验证请求</p>
                        <p className="text-sm">当其他用户提交需要您验证的请求时，它们会显示在这里</p>
                      </div>
                    ) : (
                      filteredRequests.map((request, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-amber-500">
                          <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full mr-3">
                            <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">提款请求 #{request.vault_id.substring(0, 8)}</p>
                            <p className="text-xs text-gray-500">
                              请求者: {request.owner.substring(0, 6)}...{request.owner.substring(request.owner.length - 4)}
                            </p>
                            <p className="text-xs text-gray-500">
                              过期时间: {new Date(request.expire_epoch * 1000).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleVerifyAndWithdraw(request.vault_id,request.cap,request.coin_type.name)}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" /> 批准
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRelockVault()}>
                              <XCircle className="mr-1 h-4 w-4" /> 拒绝
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* 验证历史部分保持不变 */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">验证历史</CardTitle>
              <div className="flex items-center">
                <div className="relative w-[200px] mr-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" placeholder="搜索请求ID..." />
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-4 mt-2">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">已批准 #REQ001</p>
                    <p className="text-xs text-gray-500">2025-04-20 14:30</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已批准</Badge>
                </div>

                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
                  <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">已拒绝 #REQ002</p>
                    <p className="text-xs text-gray-500">2025-04-19 10:15</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">已拒绝</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知与交易中心 */}
        <TabsContent value="center">
          <div className="space-y-4">
            <Input placeholder="搜索交易或通知..." />
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="transaction">交易</TabsTrigger>
                <TabsTrigger value="notification">通知</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ul>
                  <li>通知：您有新的交易请求</li>
                  <li>交易：#TX123 成功</li>
                </ul>
              </TabsContent>
              <TabsContent value="transaction">
                <ul>
                  <li>#TX123 成功</li>
                  <li>#TX124 等待中</li>
                </ul>
              </TabsContent>
              <TabsContent value="notification">
                <ul>
                  <li>验证请求已通过</li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    
  );
  
}
