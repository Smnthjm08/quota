import { VaultInfo } from "@/components/vault/vault-info";
import { VaultStats } from "@/components/vault/vault-stats";

export default function VaultPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
          <p className="text-muted-foreground">
            Manage your vault and linked wallet
          </p>
        </div>
        
        <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2">
          <VaultInfo />
          <VaultStats />
        </div>
      </div>
    </div>
  );
}
