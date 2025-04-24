export const vaultConstants = {
  VAULT_LOCKED: 0,
  VAULT_PENDING_VERIFICATION: 1,
  VAULT_VERIFIED: 2,
  VAULT_EMERGENCY_PENDING: 3,
  VAULT_TEMP_UNLOCKED: 4
};

export const getStatusText = (status: number): string => {
  switch (status) {
    case vaultConstants.VAULT_LOCKED:
      return '已锁定';
    case vaultConstants.VAULT_EMERGENCY_PENDING:
      return '紧急解锁中';
    case vaultConstants.VAULT_PENDING_VERIFICATION:
      return '验证中';
    default:
      return '未知状态';
  }
};