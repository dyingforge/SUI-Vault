import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusText } from "@/lib/constants";
import { DispalyVault } from "@/types/index";

interface VaultDetailsCardProps {
  vault: DispalyVault | null;
  userAddress: string | undefined;
}

export default function VaultDetailsCard({ vault, userAddress }: VaultDetailsCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">
          保险箱详情
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">所有者</span>
          <span className="text-sm font-medium truncate max-w-[180px]">{userAddress}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">验证者</span>
          <span className="text-sm font-medium truncate max-w-[180px]">{vault?.verifier}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">创建时间</span>
          <span className="text-sm font-medium">{vault?.createdAt}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">状态</span>
          <Badge className="bg-gray-100 text-gray-800">
            {getStatusText(vault?.status ?? 0)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}