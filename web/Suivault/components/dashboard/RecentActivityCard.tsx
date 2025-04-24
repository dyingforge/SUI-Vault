import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, Lock } from "lucide-react";

export default function RecentActivityCard() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300 flex justify-between">
          最近活动与通知
          <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
              <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">转账成功</p>
              <p className="text-xs text-gray-500">2025-04-20 14:30</p>
            </div>
            <Badge>+¥500</Badge>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">保险箱创建完成</p>
              <p className="text-xs text-gray-500">2025-04-19 10:15</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8">查看</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}