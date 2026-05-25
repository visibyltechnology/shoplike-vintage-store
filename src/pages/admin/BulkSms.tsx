import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare, CheckSquare, Square, Search, Send, Copy,
  RefreshCw, Users, Phone, AlertCircle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "sv_store_settings";

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: "order" | "profile";
  orderCount?: number;
}

async function fetchAllCustomers(): Promise<Customer[]> {
  const [ordersRes, profilesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("customer_name, customer_phone, customer_email")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select("id, name, phone, email")
      .order("created_at", { ascending: false }),
  ]);

  const phoneMap = new Map<string, Customer>();

  // From orders — aggregate by phone
  const orderCountByPhone = new Map<string, number>();
  (ordersRes.data || []).forEach((o: any) => {
    const phone = (o.customer_phone || "").trim().replace(/\s+/g, "");
    if (!phone) return;
    orderCountByPhone.set(phone, (orderCountByPhone.get(phone) || 0) + 1);
    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, {
        id: `order-${phone}`,
        name: o.customer_name || "Unknown",
        phone,
        email: o.customer_email || "",
        source: "order",
        orderCount: 0,
      });
    }
  });
  orderCountByPhone.forEach((count, phone) => {
    const c = phoneMap.get(phone);
    if (c) c.orderCount = count;
  });

  // From user_profiles — may override with more complete data
  (profilesRes.data || []).forEach((p: any) => {
    const phone = (p.phone || "").trim().replace(/\s+/g, "");
    if (!phone) return;
    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, {
        id: p.id,
        name: p.name || p.email?.split("@")[0] || "Customer",
        phone,
        email: p.email || "",
        source: "profile",
        orderCount: 0,
      });
    } else {
      // Enrich existing entry with profile data
      const existing = phoneMap.get(phone)!;
      if (!existing.email && p.email) existing.email = p.email;
      if (p.name && p.name !== existing.name) existing.name = p.name;
    }
  });

  return Array.from(phoneMap.values()).sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
}

async function sendTermiiSms(phones: string[], message: string, apiKey: string): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Termii bulk SMS — send in batches of 10
  const batches: string[][] = [];
  for (let i = 0; i < phones.length; i += 10) batches.push(phones.slice(i, i + 10));

  for (const batch of batches) {
    try {
      const res = await fetch("https://api.ng.termii.com/api/sms/send/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: batch,
          from: "Shoplike",
          sms: message,
          type: "plain",
          channel: "generic",
          api_key: apiKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.code === "ok") {
        success += batch.length;
      } else {
        failed += batch.length;
        errors.push(data.message || "Unknown error");
      }
    } catch (e: any) {
      failed += batch.length;
      errors.push(e.message);
    }
  }

  return { success, failed, errors };
}

export default function BulkSms() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["bulk-sms-customers"],
    queryFn: fetchAllCustomers,
  });

  const settings = getSettings();
  const smsApiKey: string = settings.smsApiKey || "";

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCustomers = customers.filter(c => selected.has(c.id));
  const selectedPhones = selectedCustomers.map(c => c.phone);

  const copyNumbers = () => {
    if (selectedPhones.length === 0) {
      toast({ title: "No customers selected", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(selectedPhones.join(", "));
    toast({ title: `${selectedPhones.length} phone number${selectedPhones.length !== 1 ? "s" : ""} copied to clipboard` });
  };

  const handleSend = async () => {
    if (selectedPhones.length === 0) {
      toast({ title: "Select at least one customer", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "Write a message first", variant: "destructive" });
      return;
    }
    if (!smsApiKey) {
      toast({
        title: "No SMS API key configured",
        description: "Go to Settings → SMS Notifications and add your Termii API key.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const { success, failed, errors } = await sendTermiiSms(selectedPhones, message.trim(), smsApiKey);
      setResult({ success, failed });
      if (success > 0) {
        toast({ title: `✅ SMS sent to ${success} customer${success !== 1 ? "s" : ""}` });
      }
      if (failed > 0) {
        toast({
          title: `${failed} message${failed !== 1 ? "s" : ""} failed`,
          description: errors[0] || "Check your Termii API key",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Bulk SMS</h1>
          <p className="text-muted-foreground text-sm">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} · {selected.size} selected
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* No API key warning */}
      {!smsApiKey && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">No Termii API key configured</p>
            <p className="text-amber-700 dark:text-amber-500 text-xs mt-0.5">
              Go to <strong>Settings → SMS Notifications</strong> and add your Termii API key to enable sending. You can still copy numbers below.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Customer list — takes 3 cols */}
        <div className="lg:col-span-3 space-y-3">
          {/* Search + select all bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, phone or email…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors shrink-0"
            >
              {allFilteredSelected ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
              {allFilteredSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="w-10 px-3 py-3"></th>
                    <th className="text-left px-3 py-3 font-medium">Customer</th>
                    <th className="text-left px-3 py-3 font-medium">Phone</th>
                    <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-3 py-3">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                    : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">
                          <Users size={28} className="mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No customers found</p>
                          <p className="text-xs mt-1">Customers appear here once they place an order or sign up.</p>
                        </td>
                      </tr>
                    )
                    : filtered.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => toggleOne(c.id)}
                        className={`cursor-pointer transition-colors hover:bg-muted/40 ${selected.has(c.id) ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-3 py-3">
                          {selected.has(c.id)
                            ? <CheckSquare size={16} className="text-primary" />
                            : <Square size={16} className="text-muted-foreground" />
                          }
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium truncate max-w-[140px]">{c.name}</p>
                          {c.email && <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.email}</p>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 text-xs font-mono">
                            <Phone size={11} className="text-muted-foreground shrink-0" />
                            {c.phone}
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          {(c.orderCount || 0) > 0
                            ? <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</span>
                            : <span className="text-xs text-muted-foreground">—</span>
                          }
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Compose panel — takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare size={16} /> Compose Message
            </h2>

            {/* Selected summary */}
            <div className={`rounded-lg p-3 text-sm ${selected.size > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {selected.size > 0
                ? <><strong>{selected.size}</strong> customer{selected.size !== 1 ? "s" : ""} selected</>
                : "No customers selected — pick from the list"
              }
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                maxLength={640}
                placeholder="Type your SMS message here…&#10;&#10;e.g. Hi! New arrivals just dropped at Shoplike Vintage. Shop now at shoplikevintage.com.ng 🛍️"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{charCount}/640 characters</span>
                <span>{smsCount} SMS credit{smsCount !== 1 ? "s" : ""} per recipient</span>
              </div>
            </div>

            {/* Result badge */}
            {result && (
              <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${result.failed === 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"}`}>
                <CheckCircle size={15} />
                <span>Sent to <strong>{result.success}</strong> · Failed: <strong>{result.failed}</strong></span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={sending || selected.size === 0 || !message.trim()}
                className="w-full flex items-center gap-2"
              >
                <Send size={15} />
                {sending ? "Sending…" : `Send SMS to ${selected.size} Customer${selected.size !== 1 ? "s" : ""}`}
              </Button>

              <Button
                variant="outline"
                onClick={copyNumbers}
                disabled={selected.size === 0}
                className="w-full flex items-center gap-2"
              >
                <Copy size={14} />
                Copy {selected.size > 0 ? `${selected.size} ` : ""}Number{selected.size !== 1 ? "s" : ""} to Clipboard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Powered by <strong>Termii</strong>. Configure your API key in{" "}
              <a href="/admin/settings" className="text-primary hover:underline">Settings → SMS</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
