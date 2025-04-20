"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BarChart, PieChart, Pie, Tooltip, Cell } from "recharts";
import { Bell, Plus, Lock, Unlock } from "lucide-react";
import { useState } from "react";

export default function VaultDashboard() {
  const [tab, setTab] = useState("dashboard");

  const data = [
    { name: 'SUI', value: 400 },
    { name: 'ETH', value: 300 },
    { name: 'BTC', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="p-4 space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 gap-2">
          <TabsTrigger value="dashboard">仪表盘</TabsTrigger>
          <TabsTrigger value="vaults">保险箱管理</TabsTrigger>
          <TabsTrigger value="vault">保险箱操作</TabsTrigger>
          <TabsTrigger value="validator">验证者控制台</TabsTrigger>
          <TabsTrigger value="center">通知与交易</TabsTrigger>
        </TabsList>

        {/* 主仪表盘 */}
        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-xl font-bold">钱包连接/登录</h2>
                <Button>连接钱包</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">保险箱总览</h2>
                <p>共计 3 个保险箱，资产总值 ¥123,456</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">资产分布</h2>
                <PieChart width={200} height={200}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">最近活动与通知</h2>
                <ul>
                  <li>转账成功</li>
                  <li>保险箱创建完成</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button className="mt-4">快捷操作</Button>
          </div>
        </TabsContent>

        {/* 保险箱管理 */}
        <TabsContent value="vaults">
          <div className="flex justify-between items-center mb-4">
            <Input placeholder="搜索保险箱..." className="w-1/2" />
            <Button><Plus className="mr-2" /> 新建保险箱</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">保险箱 #{i}</h3>
                  <p>状态：正常</p>
                  <p>资产：¥{i * 10000}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 保险箱操作 */}
        <TabsContent value="vault">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">保险箱详情</h2>
                <p>ID: abc123</p>
                <p>资产：¥50,000</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">存款</Button>
              <Button variant="outline">提款</Button>
              <Button><Lock className="mr-2" /> 锁定</Button>
              <Button><Unlock className="mr-2" /> 解锁</Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">紧急解锁</h3>
                <Button variant="destructive">立即执行</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">交易记录</h3>
                <ul>
                  <li>存款 ¥10,000</li>
                  <li>提款 ¥5,000</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 验证者控制台 */}
        <TabsContent value="validator">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-bold">交易请求</h2>
                <ul>
                  <li>#REQ123 - 待审批 <Button>审批</Button> <Button variant="destructive">拒绝</Button></li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">验证历史</h3>
                <ul>
                  <li>已批准 #REQ001</li>
                  <li>已拒绝 #REQ002</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 通知与交易中心 */}
        <TabsContent value="center">
          <div className="space-y-4">
            <Input placeholder="搜索交易或通知..." />
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="transaction">交易</TabsTrigger>
                <TabsTrigger value="notification">通知</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ul>
                  <li>通知：您有新的交易请求</li>
                  <li>交易：#TX123 成功</li>
                </ul>
              </TabsContent>
              <TabsContent value="transaction">
                <ul>
                  <li>#TX123 成功</li>
                  <li>#TX124 等待中</li>
                </ul>
              </TabsContent>
              <TabsContent value="notification">
                <ul>
                  <li>验证请求已通过</li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
