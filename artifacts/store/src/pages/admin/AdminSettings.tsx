import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Eye, EyeOff, Store, CreditCard, MessageSquare, Mail, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<any>({});
  const [showKorapaySecret, setShowKorapaySecret] = useState(false);
  const [showKorapayEnc, setShowKorapayEnc] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        storeName: settings.storeName || "",
        storeEmail: settings.storeEmail || "",
        storePhone: settings.storePhone || "",
        whatsappNumber: settings.whatsappNumber || "",
        currency: settings.currency || "NGN",
        korapayEnabled: settings.korapayEnabled || false,
        korapayPublicKey: settings.korapayPublicKey || "",
        korapaySecretKey: settings.korapaySecretKey || "",
        korapayEncKey: settings.korapayEncKey || "",
        smsApiKey: settings.smsApiKey || "",
        smsEnabled: settings.smsEnabled || false,
        emailApiKey: settings.emailApiKey || "",
        emailEnabled: settings.emailEnabled || false,
        bannerText: settings.bannerText || "",
        bannerEnabled: settings.bannerEnabled !== false,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ data: form }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Settings saved successfully" });
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Store Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your store configuration and API keys</p>
      </div>

      {/* Store Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Store size={18} /> Store Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium mb-1 block">Store Name</label>
            <input value={form.storeName || ""} onChange={(e) => setForm({...form, storeName: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-store-name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Email</label>
            <input type="email" value={form.storeEmail || ""} onChange={(e) => setForm({...form, storeEmail: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-store-email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Phone</label>
            <input value={form.storePhone || ""} onChange={(e) => setForm({...form, storePhone: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-store-phone" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">WhatsApp Number</label>
            <input value={form.whatsappNumber || ""} onChange={(e) => setForm({...form, whatsappNumber: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-whatsapp-number" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Currency</label>
            <select value={form.currency || "NGN"} onChange={(e) => setForm({...form, currency: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="select-currency">
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Megaphone size={18} /> Announcement Banner</h2>
          <Switch
            checked={form.bannerEnabled || false}
            onCheckedChange={(v) => setForm({...form, bannerEnabled: v})}
            data-testid="switch-banner-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Banner Text</label>
          <input value={form.bannerText || ""} onChange={(e) => setForm({...form, bannerText: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-banner-text" />
        </div>
      </div>

      {/* Kora Pay */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard size={18} /> Kora Pay</h2>
          <Switch
            checked={form.korapayEnabled || false}
            onCheckedChange={(v) => setForm({...form, korapayEnabled: v})}
            data-testid="switch-korapay-enabled"
          />
        </div>
        <p className="text-xs text-muted-foreground">Toggle to enable/disable Kora Pay payment option at checkout</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Public Key</label>
            <input value={form.korapayPublicKey || ""} onChange={(e) => setForm({...form, korapayPublicKey: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-korapay-public" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Secret Key</label>
            <div className="relative">
              <input type={showKorapaySecret ? "text" : "password"} value={form.korapaySecretKey || ""} onChange={(e) => setForm({...form, korapaySecretKey: e.target.value})}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-korapay-secret" />
              <button type="button" onClick={() => setShowKorapaySecret(!showKorapaySecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showKorapaySecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Encryption Key</label>
            <div className="relative">
              <input type={showKorapayEnc ? "text" : "password"} value={form.korapayEncKey || ""} onChange={(e) => setForm({...form, korapayEncKey: e.target.value})}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-korapay-enc" />
              <button type="button" onClick={() => setShowKorapayEnc(!showKorapayEnc)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showKorapayEnc ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SMS */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><MessageSquare size={18} /> SMS Notifications (Nigeria Bulk SMS)</h2>
          <Switch
            checked={form.smsEnabled || false}
            onCheckedChange={(v) => setForm({...form, smsEnabled: v})}
            data-testid="switch-sms-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">SMS API Key</label>
          <div className="relative">
            <input type={showSmsKey ? "text" : "password"} value={form.smsApiKey || ""} onChange={(e) => setForm({...form, smsApiKey: e.target.value})}
              placeholder="Enter your bulk SMS API key"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-sms-api-key" />
            <button type="button" onClick={() => setShowSmsKey(!showSmsKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showSmsKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Mail size={18} /> Email Notifications</h2>
          <Switch
            checked={form.emailEnabled || false}
            onCheckedChange={(v) => setForm({...form, emailEnabled: v})}
            data-testid="switch-email-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email API Key</label>
          <div className="relative">
            <input type={showEmailKey ? "text" : "password"} value={form.emailApiKey || ""} onChange={(e) => setForm({...form, emailApiKey: e.target.value})}
              placeholder="Enter your email API key (e.g. Mailgun, Sendgrid)"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-email-api-key" />
            <button type="button" onClick={() => setShowEmailKey(!showEmailKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showEmailKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-primary text-primary-foreground flex items-center gap-2" data-testid="button-save-settings">
        <Save size={16} /> {updateSettings.isPending ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
