import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function ValidationHistoryCard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">验证历史</CardTitle>
        <div className="flex items-center">
          <div className="relative w-[200px] mr-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-9" 
              placeholder="搜索请求ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs">查看全部</Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-4 mt-2">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">已批准 #REQ001</p>
              <p className="text-xs text-gray-500">2025-04-20 14:30</p>
            </div>
            <Badge className="bg-green-100 text-green-800">已批准</Badge>
          </div>

          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">已拒绝 #REQ002</p>
              <p className="text-xs text-gray-500">2025-04-19 10:15</p>
            </div>
            <Badge className="bg-red-100 text-red-800">已拒绝</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}