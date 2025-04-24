import WalletCard from "./WalletCard";
import VaultOverviewCard from "./VaultOverviewCard";
import AssetDistributionCard from "./AssetDistributionCard";
import RecentActivityCard from "./RecentActivityCard";
import { DispalyVault } from "@/types/index";

interface DashboardViewProps {
  vaults: DispalyVault[];
  data: any[] | undefined;
  onCreateVault: () => void;
}

export default function DashboardView({ vaults, data, onCreateVault }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WalletCard />
        <VaultOverviewCard vaults={vaults} onCreateVault={onCreateVault} />
        <AssetDistributionCard data={data} />
      </div>
      <RecentActivityCard />
    </div>
  );
}