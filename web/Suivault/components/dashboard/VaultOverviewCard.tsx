import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { DispalyVault } from "@/types/index";

interface VaultOverviewCardProps {
  vaults: DispalyVault[];
  onCreateVault: () => void;
}

export default function VaultOverviewCard({ vaults, onCreateVault }: VaultOverviewCardProps) {
  const totalAssets = vaults.reduce(
    (total, vault) => total + 
      vault.balances.reduce(
        (sum, balance) => sum + parseFloat(balance.amount), 0
      ), 
    0
  );

  return (
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
            <span className="font-medium">
              {formatAmount(totalAssets)} SUI
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onCreateVault}>
          <Plus className="mr-2 h-4 w-4" /> 创建新保险箱
        </Button>
      </CardFooter>
    </Card>
  );
}