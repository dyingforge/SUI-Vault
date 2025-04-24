import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function NotificationCenterView() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      <Input 
        placeholder="搜索交易或通知..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="transaction">交易</TabsTrigger>
          <TabsTrigger value="notification">通知</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ul className="space-y-2 mt-4">
            <li className="p-3 bg-blue-50 rounded-lg">通知：您有新的交易请求</li>
            <li className="p-3 bg-green-50 rounded-lg">交易：#TX123 成功</li>
          </ul>
        </TabsContent>
        <TabsContent value="transaction">
          <ul className="space-y-2 mt-4">
            <li className="p-3 bg-green-50 rounded-lg">#TX123 成功</li>
            <li className="p-3 bg-yellow-50 rounded-lg">#TX124 等待中</li>
          </ul>
        </TabsContent>
        <TabsContent value="notification">
          <ul className="space-y-2 mt-4">
            <li className="p-3 bg-blue-50 rounded-lg">验证请求已通过</li>
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}