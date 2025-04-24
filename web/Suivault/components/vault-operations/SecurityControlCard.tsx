import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, XCircle } from "lucide-react";
import { DispalyVault } from "@/types/index";

interface SecurityControlCardProps {
  vault: DispalyVault | null;
  onRelock: () => void;
  onInitiateEmergencyUnlock: () => void;
  onExecuteEmergencyUnlock: () => void;
  onCancelEmergencyUnlock: () => void;
}

export default function SecurityControlCard({
  vault,
  onRelock,
  onInitiateEmergencyUnlock,
  onExecuteEmergencyUnlock,
  onCancelEmergencyUnlock
}: SecurityControlCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">安全控制</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            保险箱锁定状态可以通过以下操作来管理。紧急解锁将在7天后自动执行。
          </p>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3">
        <Button 
          className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 text-white font-medium py-2.5"
          onClick={onRelock}
          disabled={!vault}
        >
          <Lock className="mr-2 h-4.5 w-4.5" /> 
          <span>锁定保险箱</span>
        </Button>
        
        <Button 
          className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg transition-all duration-200 text-white font-medium py-2.5" 
          onClick={onInitiateEmergencyUnlock} 
          disabled={!vault}
        >
          <Unlock className="mr-2 h-4.5 w-4.5" /> 
          <span>发起紧急解锁</span>
        </Button>
        
        <Button 
          variant="destructive" 
          className="col-span-2 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 text-white font-medium py-2.5"
          onClick={onExecuteEmergencyUnlock}
          disabled={!vault}
        >
          <XCircle className="mr-2 h-5 w-5" />
          <span>执行紧急解锁</span>
        </Button>
        
        <Button 
          variant="outline"
          className="col-span-2 flex items-center justify-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 font-medium py-2.5 mt-1"
          onClick={onCancelEmergencyUnlock}
          disabled={!vault}
        >
          <XCircle className="mr-2 h-4.5 w-4.5" />
          <span>取消紧急解锁</span>
        </Button>
      </CardFooter>
    </Card>
  );
}