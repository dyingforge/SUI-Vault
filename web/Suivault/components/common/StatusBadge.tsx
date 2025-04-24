import { Badge } from "@/components/ui/badge";
import { vaultConstants } from "@/lib/constants";

interface StatusBadgeProps {
  status: number;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusText = () => {
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

  const getBadgeStyle = () => {
    switch (status) {
      case vaultConstants.VAULT_LOCKED:
        return 'bg-gray-100 text-gray-800';
      case vaultConstants.VAULT_EMERGENCY_PENDING:
        return 'bg-amber-100 text-amber-800';
      case vaultConstants.VAULT_PENDING_VERIFICATION:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getBadgeStyle()}>
      {getStatusText()}
    </Badge>
  );
}