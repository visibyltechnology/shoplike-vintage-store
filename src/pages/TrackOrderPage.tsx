import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  processing: "text-purple-600 bg-purple-50 border-purple-200",
  shipped: "text-indigo-600 bg-indigo-50 border-indigo-200",
  delivered: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function printReceipt(order: any) {
  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) return;
  const items = Array.isArray(order.items) ? order.items : [];
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderRef}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f4f4f4; padding: 8px 12px; text-align: left; font-size: 13px; border-bottom: 2px solid #e0e0e0; }
        td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
        .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #333; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
        .info-box { background: #f9f9f9; padding: 12px; border-radius: 8px; }
        .info-box h3 { font-size: 12px; color: #888; text-transform: uppercase; margin: 0 0 8px; }
        .info-box p { margin: 2px 0; font-size: 13px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e8f5e9; color: #2e7d32; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>🛍 Shoplike Vintage</h1>
      <p class="subtitle">Order Receipt</p>
      <div class="info-grid">
        <div class="info-box">
          <h3>Order Info</h3>
          <p><b>Ref:</b> ${order.orderRef}</p>
          <p><b>Date:</b> ${formatDate(order.createdAt)}</p>
          <p><b>Status:</b> <span class="badge">${order.status}</span></p>
          <p><b>Payment:</b> ${order.paymentStatus}</p>
        </div>
        <div class="info-box">
          <h3>Delivery To</h3>
          <p>${order.customerName}</p>
          <p>${order.customerPhone}</p>
          ${order.customerEmail ? `<p>${order.customerEmail}</p>` : ""}
          <p>${order.shippingAddress?.address || ""}</p>
          <p>${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${items.map((i: any) => `
            <tr>
              <td>${i.name}</td>
              <td>${i.size || "-"}</td>
              <td>${i.qty}</td>
              <td>₦${Number(i.price).toLocaleString()}</td>
              <td>₦${(i.price * i.qty).toLocaleString()}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="4">Total</td>
            <td>₦${Number(order.total).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:32px;">Thank you for shopping with Shoplike Vintage! For enquiries call/WhatsApp: 09063172596</p>
      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export default function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`${BASE}/api/orders/track?ref=${encodeURIComponent(ref.trim())}`);
      if (!res.ok) {
        setError("Order not found. Please check the reference and try again.");
        return;
      }
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">Enter your order reference to see the latest status.</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. SLV-1747123456-ABCD"
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" disabled={loading} className="px-6 py-3">
          <Search size={18} className="mr-2" />
          {loading ? "Searching..." : "Track"}
        </Button>
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 mb-6">
          <XCircle size={20} className="text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Reference</p>
                <p className="font-mono font-bold text-lg text-primary">{order.orderRef}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => printReceipt(order)}>
                  <Printer size={14} className="mr-1" /> Print Receipt
                </Button>
                <Button size="sm" variant="outline" onClick={() => printReceipt(order)}>
                  <Download size={14} className="mr-1" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone = i <= stepIndex && order.status !== "cancelled";
                const isCurrent = i === stepIndex && order.status !== "cancelled";
                return (
                  <div key={step.key} className="flex items-center shrink-0">
                    <div className={`flex flex-col items-center ${i <= stepIndex && order.status !== "cancelled" ? "opacity-100" : "opacity-40"}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCurrent ? "border-primary bg-primary text-primary-foreground" :
                        isDone ? "border-green-500 bg-green-500 text-white" : "border-border bg-background"
                      }`}>
                        <Icon size={16} />
                      </div>
                      <p className={`text-xs mt-1 font-medium whitespace-nowrap ${isCurrent ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 w-8 md:w-14 mx-1 rounded ${i < stepIndex && order.status !== "cancelled" ? "bg-green-500" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
              {order.status === "cancelled" && (
                <div className="flex items-center gap-2 ml-4">
                  <XCircle size={20} className="text-destructive" />
                  <span className="text-sm font-medium text-destructive">Cancelled</span>
                </div>
              )}
            </div>

            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${STATUS_COLOR[order.status] || "text-gray-600 bg-gray-50 border-gray-200"}`}>
              Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              {" · "}Payment: {order.paymentStatus}
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-base mb-4">Order Items</h3>
            <div className="space-y-3">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-14 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                  </div>
                  <p className="font-semibold text-primary text-sm">₦{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base pt-4 border-t border-border mt-2">
              <span>Total</span>
              <span className="text-primary">₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2"><Truck size={18} /> Delivery Address</h3>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm text-muted-foreground">{order.customerEmail}</p>}
            <p className="text-sm mt-2">{order.shippingAddress?.address}</p>
            <p className="text-sm">{order.shippingAddress?.city}, {order.shippingAddress?.state}, Nigeria</p>
          </div>
        </div>
      )}
    </div>
  );
}
