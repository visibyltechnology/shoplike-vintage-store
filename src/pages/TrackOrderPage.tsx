import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const STATUS_STEPS = [
  { key: "pending",    label: "Order Placed", icon: Clock },
  { key: "confirmed",  label: "Confirmed",    icon: CheckCircle },
  { key: "processing", label: "Processing",   icon: Package },
  { key: "shipped",    label: "Shipped",      icon: Truck },
  { key: "delivered",  label: "Delivered",    icon: CheckCircle },
];

const STATUS_COLOR: Record<string, string> = {
  pending:    "text-yellow-600 bg-yellow-50 border-yellow-200",
  confirmed:  "text-blue-600 bg-blue-50 border-blue-200",
  processing: "text-purple-600 bg-purple-50 border-purple-200",
  shipped:    "text-indigo-600 bg-indigo-50 border-indigo-200",
  delivered:  "text-green-600 bg-green-50 border-green-200",
  cancelled:  "text-red-600 bg-red-50 border-red-200",
};

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function printReceipt(order: any) {
  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) return;
  const items = Array.isArray(order.items) ? order.items : [];
  win.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${order.order_ref}</title>
    <style>body{font-family:Arial;padding:40px;color:#111}h1{color:#be185d}table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#be185d;color:#fff;padding:8px}td{padding:8px;border-bottom:1px solid #eee}.total{font-weight:bold;color:#be185d}
    </style></head><body>
    <h1>SHOPLIKE VINTAGE</h1><h3>Order: ${order.order_ref}</h3>
    <p><b>${order.customer_name}</b> · ${order.customer_phone||""} · ${order.customer_email||""}</p>
    <p>${order.shipping_address?.address||""}, ${order.shipping_address?.city||""}, ${order.shipping_address?.state||""}</p>
    <table><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
    ${items.map((i:any)=>`<tr><td>${i.name}</td><td>${i.size||"–"}</td><td>${i.qty}</td><td>₦${(i.price*i.qty).toLocaleString()}</td></tr>`).join("")}
    <tr><td colspan="3" class="total" style="text-align:right">Total</td><td class="total">₦${Number(order.total).toLocaleString()}</td></tr>
    </tbody></table>
    <p>Status: ${order.status} · Payment: ${order.payment_status}</p>
    <p style="margin-top:32px;font-size:12px;color:#888">Thank you for shopping with Shoplike Vintage! WhatsApp: 09063172596</p>
    <script>window.onload=()=>{window.print()}</script></body></html>`);
  win.document.close();
}

export default function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setOrder(null);
    setNotFound(false);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_ref", ref.trim())
        .single();
      if (error || !data) { setNotFound(true); }
      else { setOrder(data); }
    } catch {
      toast({ title: "Error", description: "Could not fetch order. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const stepIdx = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">Enter your order reference number to see your delivery status.</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 mb-8">
        <input
          value={ref}
          onChange={e => setRef(e.target.value)}
          placeholder="e.g. SV-1716123456789-AB12"
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="input-track-ref"
        />
        <Button type="submit" disabled={loading} className="px-6 rounded-xl" data-testid="button-track-order">
          {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search size={18} />}
        </Button>
      </form>

      {notFound && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center text-destructive">
          <XCircle size={32} className="mx-auto mb-2" />
          <p className="font-semibold">Order not found</p>
          <p className="text-sm mt-1 opacity-80">Check your reference number and try again, or contact us on WhatsApp.</p>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Status badge */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${STATUS_COLOR[order.status] || STATUS_COLOR.pending}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5">Order Status</p>
              <p className="font-bold text-lg capitalize">{order.status}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60 mb-0.5">Payment</p>
              <p className={`font-semibold capitalize ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                {order.payment_status}
              </p>
            </div>
          </div>

          {/* Progress stepper */}
          {order.status !== "cancelled" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-border mx-8" />
                <div
                  className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-700 mx-8"
                  style={{ right: `${(1 - stepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= stepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? "bg-primary border-primary text-white" : "bg-card border-border text-muted-foreground"}`}>
                        <Icon size={16} />
                      </div>
                      <p className={`text-[10px] font-semibold text-center max-w-[56px] ${done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Reference</p>
                <p className="font-mono font-bold text-primary">{order.order_ref}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Placed on</p>
                <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-sm font-medium mb-1">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground">{order.customer_phone} · {order.customer_email}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Truck size={12} /> {order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.state}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-12 object-cover rounded-lg shrink-0" />}
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{[item.size && `Size: ${item.size}`, `Qty: ${item.qty}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p className="text-primary font-bold text-sm">₦{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold border-t border-border pt-3">
              <span>Total</span>
              <span className="text-primary">₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => printReceipt(order)} className="flex items-center gap-2 flex-1">
              <Printer size={14} /> Print Receipt
            </Button>
            <Button variant="outline" onClick={() => printReceipt(order)} className="flex items-center gap-2 flex-1">
              <Download size={14} /> Download PDF
            </Button>
            <a href="https://wa.me/2349063172596" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-600 transition-colors">
              💬 WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
