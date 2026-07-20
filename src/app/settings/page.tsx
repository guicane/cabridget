import { getSettings } from "@/actions/settings"
import { SettingsForm } from "@/components/settings/SettingsForm"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your global preferences.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8">
        <SettingsForm initialCurrency={settings.currency} />
      </div>
    </div>
  )
}
