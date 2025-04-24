import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionHistoryCard() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">交易记录</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 mt-2">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
              <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">存款</p>
              <p className="text-xs text-gray-500">2025-04-20 14:30</p>
            </div>
            <Badge className="bg-green-100 text-green-800">+1000 SUI</Badge>
          </div>

          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
              <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">提款</p>
              <p className="text-xs text-gray-500">2025-04-19 10:15</p>
            </div>
            <Badge className="bg-red-100 text-red-800">-500 SUI</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}