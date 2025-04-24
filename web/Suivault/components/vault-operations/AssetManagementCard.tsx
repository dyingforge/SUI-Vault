import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { DispalyVault } from "@/types/index";

interface AssetManagementCardProps {
  vault: DispalyVault | null;
  data: any[] | undefined;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
}

export default function AssetManagementCard({ 
  vault, 
  data,
  onDepositClick,
  onWithdrawClick
}: AssetManagementCardProps) {
  return (
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
                <span className="text-sm font-medium">
                  {formatAmount(asset.amount)} {asset.coin.split("::").pop()}
                </span>
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
        <Button 
          variant="outline" 
          className="flex items-center justify-center" 
          onClick={onDepositClick}
          disabled={!vault}
        >
          <ArrowDownLeft className="mr-2 h-4 w-4" /> 存款
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center" 
          onClick={onWithdrawClick}
          disabled={!vault}
        >
          <ArrowUpRight className="mr-2 h-4 w-4" /> 提款
        </Button>
      </CardFooter>
    </Card>
  );
}