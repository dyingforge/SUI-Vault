import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface AssetDistributionCardProps {
  data: any[] | undefined;
}

export default function AssetDistributionCard({ data }: AssetDistributionCardProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">资产分布</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <div className="flex justify-around w-full">
          {data?.map((entry, index) => (
            <div key={index} className="flex items-center">
              <span 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs">{entry.coin}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}