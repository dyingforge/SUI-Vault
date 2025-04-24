import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { VerificationRequested } from "@/types/index";

interface PendingRequestsCardProps {
  filteredRequests: VerificationRequested[];
  onVerifyAndWithdraw: (vaultId: string, cap: string, coinType: string) => void;
  onRelock: () => void;
}

export default function PendingRequestsCard({
  filteredRequests,
  onVerifyAndWithdraw,
  onRelock
}: PendingRequestsCardProps) {
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
                    onClick={() => onVerifyAndWithdraw(
                      request.vault_id,
                      request.cap,
                      request.coin_type.name
                    )}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" /> 批准
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={onRelock}
                  >
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
}