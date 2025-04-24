import { useState } from "react";
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx";
import {
  createVaultTx, relockTx, depositCoinTx, verifyAndWithdrawTx,
  requestVerificationTx, initiateEmergencyUnlockTx, 
  executeEmergencyUnlockTx, cancelEmergencyUnlockTx
} from "@/contracts/vault";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiCoin,DispalyVault } from "@/types/index";

export function useVaultTransactions(currentUser: any, selectedVault: DispalyVault) {
  const { handleSignAndExecuteTransaction: createVault } = useBetterSignAndExecuteTransaction({tx: createVaultTx});
  const { handleSignAndExecuteTransaction: relockVault } = useBetterSignAndExecuteTransaction({tx: relockTx});
  const { handleSignAndExecuteTransaction: verifyAndWithdraw } = useBetterSignAndExecuteTransaction({tx: verifyAndWithdrawTx});
  const { handleSignAndExecuteTransaction: depositCoin } = useBetterSignAndExecuteTransaction({tx: depositCoinTx});
  const { handleSignAndExecuteTransaction: withdrawCoin } = useBetterSignAndExecuteTransaction({tx: requestVerificationTx});
  const { handleSignAndExecuteTransaction: initiateEmergencyUnlock } = useBetterSignAndExecuteTransaction({tx: initiateEmergencyUnlockTx});
  const { handleSignAndExecuteTransaction: executeEmergencyUnlock } = useBetterSignAndExecuteTransaction({tx: executeEmergencyUnlockTx});
  const { handleSignAndExecuteTransaction: cancelEmergencyUnlock } = useBetterSignAndExecuteTransaction({tx: cancelEmergencyUnlockTx});

  // 处理创建保险箱
  const handleCreateVault = async (verifier_address: string, name: string) => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address)) {
      console.error("缺少必要参数：用户地址");
      return;
    }
    createVault({verifier_address, name})
      .onSuccess(result => console.log("创建成功", result))
      .onError(e => console.log("创建失败", e))
      .execute();
  };

  // 处理锁定保险箱
  const handleRelock = async () => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
      console.error("缺少必要参数：用户地址或保险箱");
      return;
    }
    relockVault({vault: selectedVault.id.id})
      .onSuccess(result => console.log("锁定成功", result))
      .onError(error => console.error("锁定失败", error))
      .execute();
  };

  // 紧急解锁
  const handleInitiateEmergencyUnlock = async () => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
      console.error("缺少必要参数：用户地址或保险箱");
      return;
    }
    initiateEmergencyUnlock({
      vault: selectedVault.id.id,
    })
    .onSuccess(result => console.log("紧急解锁交易成功:", result))
    .onError(error => console.error("紧急解锁交易错误:", error))
    .execute();
  };

  // 执行紧急解锁
  const handleExecuteEmergencyUnlock = async () => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
      console.error("缺少必要参数：用户地址或保险箱");
      return;
    }
    executeEmergencyUnlock({
      vault: selectedVault.id.id,
      recipient: currentUser?.address,
      coin_type: selectedVault.balances.map((item) => item.coin),
    }).execute();
  };

  // 取消紧急解锁
  const handleCancelEmergencyUnlock = async () => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
      console.error("缺少必要参数：用户地址或保险箱");
      return;
    }
    cancelEmergencyUnlock({
      vault: selectedVault.id.id,
    }).execute();
  };

  // 审批提款
  const handleVerifyAndWithdraw = async (vaultId: string, cap: string, coin_type: string) => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address)) {
      console.error("缺少必要参数：用户地址");
      return;
    }
    verifyAndWithdraw({vault: vaultId, cap: cap, coin_type: coin_type})
      .onSuccess(result => console.log("提款请求交易成功:", result))
      .onError(error => console.error("提款请求交易错误:", error))
      .execute();
  };

  // 存款
  const handleDepositCoin = async (asset: SuiCoin, amount: number) => {
    if (!currentUser?.address || !isValidSuiAddress(currentUser?.address) || !selectedVault) {
      console.error("缺少必要参数：用户地址或保险箱");
      return;
    }
    const coinAmount = Math.floor(amount * 10 ** (asset.coinMetadata?.decimals || 0));
    
    depositCoin({
      vault: selectedVault.id.id,
      coin: asset.id,
      amount: coinAmount,
      coin_type: asset.type,
    })
    .onSuccess(result => console.log("存款交易成功:", result))
    .onError(error => console.error("存款交易错误:", error))
    .execute();
  };

  // 提款
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
    .onSuccess(result => console.log("提款请求交易成功:", result))
    .onError(error => console.error("提款请求交易错误:", error))
    .execute();
  };

  return {
    handleCreateVault,
    handleRelock,
    handleDepositCoin,
    handleWithdrawCoin,
    handleInitiateEmergencyUnlock,
    handleExecuteEmergencyUnlock,
    handleCancelEmergencyUnlock,
    handleVerifyAndWithdraw
  };
}