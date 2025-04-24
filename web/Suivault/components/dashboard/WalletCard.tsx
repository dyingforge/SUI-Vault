import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

export default function WalletCard() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">钱包连接</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-2">
          <Wallet className="h-10 w-10 text-primary" />
          <div>
            <p className="text-sm text-gray-500">连接您的 SUI 钱包</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <ConnectButton className="w-full" />
      </CardFooter>
    </Card>
  );
}