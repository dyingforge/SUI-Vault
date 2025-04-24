import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Unlock } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import AssetBalance from "../common/AssetBalance";
import { DispalyVault } from "@/types/index";
import { vaultConstants } from "@/lib/constants";

interface VaultCardProps {
  vault: DispalyVault;
  onClick: () => void;
  index: number;
}

export default function VaultCard({ vault, onClick, index }: VaultCardProps) {
  return (
    <Card 
      className={`border-l-4 ${
        vault.status === vaultConstants.VAULT_EMERGENCY_PENDING 
          ? 'border-amber-500' 
          : index === 0 
            ? 'border-blue-500' 
            : 'border-purple-500'
      } shadow-sm hover:shadow-md transition-all cursor-pointer`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg font-medium">{vault.name}</CardTitle>
          <StatusBadge status={vault.status} />
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
            <AssetBalance 
              key={i}
              coin={balance.coin}
              amount={balance.amount}
            />
          ))}
          
          {vault.status === vaultConstants.VAULT_EMERGENCY_PENDING && (
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
        <Button 
          variant="outline"
          className={`w-full ${
            vault.status === vaultConstants.VAULT_EMERGENCY_PENDING
              ? 'text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100' 
              : ''
          }`}
        >
          {vault.status === vaultConstants.VAULT_EMERGENCY_PENDING
            ? <><Calendar className="mr-2 h-4 w-4" />管理紧急状态</>
            : <><Unlock className="mr-2 h-4 w-4" />管理</>
          }
        </Button>
      </CardFooter>
    </Card>
  );
}