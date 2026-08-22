import { getSettings } from "@/actions/settings"
import { getMerchantMappings } from "@/actions/statement-import"
import { SettingsForm } from "@/components/settings/SettingsForm"
import { MerchantMappingsSettings } from "@/components/settings/MerchantMappingsSettings"

export default async function SettingsPage() {
  const settings = await getSettings()
  const merchantMappings = await getMerchantMappings()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your global preferences.</p>
      </div>

      <div className="bg-card rounded-[18px] border border-border p-8">
        <SettingsForm initialCurrency={settings.currency} />
      </div>

      <div className="bg-card rounded-[18px] border border-border p-8">
        <h2 className="text-lg font-semibold text-foreground mb-1">Merchant Mappings</h2>
        <MerchantMappingsSettings initialMappings={merchantMappings} />
      </div>
    </div>
  )
}
