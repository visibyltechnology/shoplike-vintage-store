import { useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Save, Eye, EyeOff, Store, CreditCard, MessageSquare, Mail, Megaphone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "sv_store_settings";

const DEFAULT_SETTINGS = {
  storeName: "Shoplike Vintage",
  storeEmail: "Shoplikevintage@gmail.com",
  storePhone: "+2349063172596",
  whatsappNumber: "09063172596",
  currency: "NGN",
  korapayEnabled: true,
  korapayPublicKey: "",
  korapaySecretKey: "",
  korapayEncKey: "",
  smsApiKey: "",
  smsEnabled: false,
  emailApiKey: "",
  emailEnabled: false,
  bannerText: "",
  bannerEnabled: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(data: typeof DEFAULT_SETTINGS) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ["local-settings"],
    queryFn: loadSettings,
    staleTime: Infinity,
  });

  const save = useMutation({
    mutationFn: async (data: any) => {
      persistSettings(data);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["local-settings"], data);
      toast({ title: "Settings saved", description: "All changes have been saved successfully." });
    },
  });

  const [form, setForm] = useState<any>({ ...DEFAULT_SETTINGS });
  const [showKorapaySecret, setShowKorapaySecret] = useState(false);
  const [showKorapayEnc, setShowKorapayEnc] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }));

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const inputMonoCls = inputCls + " font-mono";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Store Settings</h1>
        <p className="text-muted-foreground text-sm">Changes are saved locally in your browser and applied immediately.</p>
      </div>

      {/* Store Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Store size={17} /> Store Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium mb-1 block">Store Name</label>
            <input value={form.storeName || ""} onChange={f("storeName")} className={inputCls} data-testid="input-store-name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Email</label>
            <input type="email" value={form.storeEmail || ""} onChange={f("storeEmail")} className={inputCls} data-testid="input-store-email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Phone</label>
            <input value={form.storePhone || ""} onChange={f("storePhone")} className={inputCls} data-testid="input-store-phone" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">WhatsApp Number</label>
            <input value={form.whatsappNumber || ""} onChange={f("whatsappNumber")} className={inputCls} data-testid="input-whatsapp-number" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Currency</label>
            <select value={form.currency || "NGN"} onChange={f("currency")} className={inputCls} data-testid="select-currency">
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Megaphone size={17} /> Announcement Banner</h2>
          <Switch
            checked={!!form.bannerEnabled}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, bannerEnabled: v }))}
            data-testid="switch-banner-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Banner Text</label>
          <input
            value={form.bannerText || ""}
            onChange={f("bannerText")}
            placeholder="e.g. Free shipping on orders above ₦30,000!"
            className={inputCls}
            data-testid="input-banner-text"
          />
        </div>
      </div>

      {/* Korapay */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard size={17} /> Korapay Payment</h2>
          <Switch
            checked={!!form.korapayEnabled}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, korapayEnabled: v }))}
            data-testid="switch-korapay-enabled"
          />
        </div>
        <p className="text-xs text-muted-foreground">Enable/disable Korapay at checkout. Keys are stored securely in this browser.</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Public Key</label>
            <input
              value={form.korapayPublicKey || ""}
              onChange={f("korapayPublicKey")}
              placeholder="pk_test_..."
              className={inputMonoCls}
              data-testid="input-korapay-public"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Secret Key</label>
            <div className="relative">
              <input
                type={showKorapaySecret ? "text" : "password"}
                value={form.korapaySecretKey || ""}
                onChange={f("korapaySecretKey")}
                placeholder="sk_test_..."
                className={inputMonoCls + " pr-10"}
                data-testid="input-korapay-secret"
              />
              <button type="button" onClick={() => setShowKorapaySecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showKorapaySecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Encryption Key</label>
            <div className="relative">
              <input
                type={showKorapayEnc ? "text" : "password"}
                value={form.korapayEncKey || ""}
                onChange={f("korapayEncKey")}
                placeholder="Encryption key..."
                className={inputMonoCls + " pr-10"}
                data-testid="input-korapay-enc"
              />
              <button type="button" onClick={() => setShowKorapayEnc(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showKorapayEnc ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SMS */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><MessageSquare size={17} /> SMS Notifications</h2>
          <Switch
            checked={!!form.smsEnabled}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, smsEnabled: v }))}
            data-testid="switch-sms-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">SMS API Key</label>
          <div className="relative">
            <input
              type={showSmsKey ? "text" : "password"}
              value={form.smsApiKey || ""}
              onChange={f("smsApiKey")}
              placeholder="Nigeria Bulk SMS API key"
              className={inputMonoCls + " pr-10"}
              data-testid="input-sms-api-key"
            />
            <button type="button" onClick={() => setShowSmsKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showSmsKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Mail size={17} /> Email Notifications</h2>
          <Switch
            checked={!!form.emailEnabled}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, emailEnabled: v }))}
            data-testid="switch-email-enabled"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email API Key</label>
          <div className="relative">
            <input
              type={showEmailKey ? "text" : "password"}
              value={form.emailApiKey || ""}
              onChange={f("emailApiKey")}
              placeholder="Mailgun / Sendgrid API key"
              className={inputMonoCls + " pr-10"}
              data-testid="input-email-api-key"
            />
            <button type="button" onClick={() => setShowEmailKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showEmailKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      <Button
        onClick={() => save.mutate(form)}
        disabled={save.isPending}
        className="flex items-center gap-2 px-8 py-6 text-base font-semibold rounded-xl"
        data-testid="button-save-settings"
      >
        {save.isSuccess ? <CheckCircle size={17} /> : <Save size={17} />}
        {save.isPending ? "Saving…" : save.isSuccess ? "Saved!" : "Save All Settings"}
      </Button>
    </div>
  );
}
