import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle, MessageCircle, ShoppingBag, Download, Printer, Package, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function printReceipt(order: any) {
  const win = window.open("", "_blank", "width=640,height=900");
  if (!win) return;
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Receipt - ${order.order_ref}</title><meta charset="utf-8"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:40px;color:#111;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:3px solid #be185d;padding-bottom:16px}
      .store-name{font-size:22px;font-weight:900;color:#be185d;letter-spacing:2px}
      .store-tag{font-size:11px;color:#888;margin-top:4px}
      .ref{font-family:monospace;font-size:16px;font-weight:bold;color:#be185d}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}
      .info-box{background:#fafafa;border:1px solid #eee;padding:14px;border-radius:8px}
      .info-box h3{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
      .info-box p{margin:3px 0;font-size:13px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#be185d;color:white;padding:10px 12px;text-align:left;font-size:12px}
      td{padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;vertical-align:top}
      .total-row td{font-weight:bold;font-size:15px;background:#fff8f8;border-top:2px solid #be185d;color:#be185d}
      .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;background:#e8f5e9;color:#2e7d32}
      .footer{margin-top:40px;border-top:1px dashed #ddd;padding-top:16px;color:#888;font-size:11px;text-align:center;line-height:1.8}
      @media print{body{padding:20px}@page{margin:1cm}}
    </style></head><body>
    <div class="header">
      <div><div class="store-name">SHOPLIKE VINTAGE</div><div class="store-tag">Premium Vintage Fashion · Est. MMXX</div></div>
      <div style="text-align:right">OFFICIAL RECEIPT<br/><span class="ref">${order.order_ref}</span><br/><small style="color:#888;font-size:11px">${date}</small></div>
    </div>
    <div class="info-grid">
      <div class="info-box"><h3>Order Details</h3>
        <p><b>Reference:</b> ${order.order_ref}</p>
        <p><b>Date:</b> ${date}</p>
        <p><b>Status:</b> <span class="badge">${order.status}</span></p>
        <p><b>Payment:</b> ${order.payment_status}</p>
      </div>
      <div class="info-box"><h3>Customer & Delivery</h3>
        <p><b>${order.customer_name}</b></p>
        <p>${order.customer_phone || ""}</p>
        ${order.customer_email ? `<p>${order.customer_email}</p>` : ""}
        <p style="margin-top:6px">${order.shipping_address?.address || ""}</p>
        <p>${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""}, Nigeria</p>
      </div>
    </div>
    <table><thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>
      ${items.map((i) => `<tr><td>${i.name}</td><td>${i.size||"–"}</td><td>${i.qty}</td><td>₦${Number(i.price).toLocaleString()}</td><td>₦${(i.price*i.qty).toLocaleString()}</td></tr>`).join("")}
      <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL</td><td>₦${Number(order.total).toLocaleString()}</td></tr>
    </tbody></table>
    <div class="footer">
      Thank you for shopping with <b>Shoplike Vintage</b>!<br/>
      Questions? Call or WhatsApp: <b>09063172596</b> · Email: Shoplikevintage@gmail.com<br/>
      This serves as your official purchase receipt.
    </div>
    <script>window.onload=()=>{window.print()}</script>
    </body></html>`);
  win.document.close();
}

export default function OrderSuccessPage() {
  const { ref } = useParams<{ ref: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    supabase
      .from("orders")
      .select("*")
      .eq("order_ref", ref)
      .single()
      .then(({ data }) => { setOrder(data); setLoading(false); });
  }, [ref]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-green-200">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground text-lg">Thank you for shopping with Shoplike Vintage 🎉</p>
      </div>

      {/* Order ref */}
      {ref && (
        <div className="bg-muted rounded-2xl p-5 mb-6 text-center border border-border">
          <p className="text-sm text-muted-foreground mb-1">Your order reference</p>
          <p className="font-mono font-bold text-2xl text-primary" data-testid="text-order-ref">{ref}</p>
          <p className="text-xs text-muted-foreground mt-2">📸 Screenshot this to track your order</p>
        </div>
      )}

      {/* Payment status badge */}
      {!loading && order && (
        <div className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 mb-6 text-sm font-semibold ${
          order.payment_status === "paid"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {order.payment_status === "paid" ? (
            <><CheckCircle size={16} /> Payment confirmed — your order is being processed</>
          ) : (
            <><Clock size={16} /> Payment pending — our team will confirm your order shortly</>
          )}
        </div>
      )}

      {/* Order details */}
      {!loading && order && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Package size={18} /> Order Details</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => printReceipt(order)} className="flex items-center gap-1.5">
                <Printer size={13} /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={() => printReceipt(order)} className="flex items-center gap-1.5">
                <Download size={13} /> PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-14 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`, `Qty: ${item.qty}`].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="font-bold text-primary text-sm shrink-0">₦{(item.price * item.qty).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-base border-t border-border pt-3">
            <span>Total Paid</span>
            <span className="text-primary">₦{Number(order.total).toLocaleString()}</span>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-sm text-muted-foreground flex items-center gap-2">
            <Truck size={14} className="shrink-0" />
            Delivering to: <span className="text-foreground font-medium">{order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.state}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center text-muted-foreground">
          Loading order details…
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center mb-6">
        We'll contact you on WhatsApp or phone to confirm your delivery details and estimated arrival time.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="https://wa.me/2349063172596"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
          data-testid="link-whatsapp-order"
        >
          <MessageCircle size={18} /> Chat on WhatsApp
        </a>
        <Link href="/track-order">
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <Package size={18} /> Track Order
          </Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto" data-testid="button-continue-shopping-success">
            <ShoppingBag size={18} /> Shop More
          </Button>
        </Link>
      </div>
    </div>
  );
}
