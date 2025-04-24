import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import VaultCard from "./VaultCard";
import { DispalyVault } from "@/types/index";
import { useState } from "react";

interface VaultsManagementViewProps {
  vaults: DispalyVault[];
  onVaultSelect: (id: string) => void;
  onCreateVault: () => void;
}

export default function VaultsManagementView({ 
  vaults, 
  onVaultSelect, 
  onCreateVault 
}: VaultsManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // 过滤保险箱
  const filteredVaults = searchTerm 
    ? vaults.filter(vault => 
        vault.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vault.id.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : vaults;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold">我的保险箱</h2>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">共 {vaults.length} 个</Badge>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-10 w-[250px]" 
              placeholder="搜索保险箱..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateVault}>
            <Plus className="mr-2 h-4 w-4" /> 创建保险箱
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVaults.length > 0 ? (
          filteredVaults.map((vault, index) => (
            <VaultCard 
              key={vault.id.id} 
              vault={vault} 
              index={index}
              onClick={() => onVaultSelect(vault.id.id)}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">没有找到符合条件的保险箱</p>
          </div>
        )}
      </div>
    </div>
  );
}