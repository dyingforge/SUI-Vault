import { Badge } from "@/components/ui/badge";
import PendingRequestsCard from "./PendingRequestsCard";
import ValidationHistoryCard from "./ValidationHistoryCard";
import { VerificationRequested } from "@/types/index";

interface ValidatorConsoleViewProps {
  currentUser: any;
  requests: VerificationRequested[] | null;
  onVerifyAndWithdraw: (vaultId: string, cap: string, coinType: string) => void;
  onRelock: () => void;
}

export default function ValidatorConsoleView({
  currentUser,
  requests,
  onVerifyAndWithdraw,
  onRelock
}: ValidatorConsoleViewProps) {
  // 过滤当前用户作为验证者的请求
  const filteredRequests = requests?.filter(request => 
    request.verifier.toLowerCase() === currentUser?.address?.toLowerCase()
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">验证者控制台</h2>
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
          当前角色: 验证者
        </Badge>
      </div>

      <PendingRequestsCard 
        filteredRequests={filteredRequests}
        onVerifyAndWithdraw={onVerifyAndWithdraw}
        onRelock={onRelock}
      />

      <ValidationHistoryCard />
    </div>
  );
}