import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle, MessageCircle, ShoppingBag, Download, Printer, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function printReceipt(order: any) {
  const win = window.open("", "_blank", "width=640,height=900");
  if (!win) return;
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.createdAt).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderRef}</title>
      <meta charset="utf-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #be185d; padding-bottom: 16px; }
        .store-name { font-size: 22px; font-weight: 900; color: #be185d; letter-spacing: 2px; }
        .store-tag { font-size: 11px; color: #888; margin-top: 4px; }
        .receipt-title { font-size: 13px; font-weight: bold; color: #444; text-align: right; }
        .ref { font-family: monospace; font-size: 16px; font-weight: bold; color: #be185d; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
        .info-box { background: #fafafa; border: 1px solid #eee; padding: 14px; border-radius: 8px; }
        .info-box h3 { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .info-box p { margin: 3px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #be185d; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
        td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; vertical-align: top; }
        .total-row td { font-weight: bold; font-size: 15px; background: #fff8f8; border-top: 2px solid #be185d; color: #be185d; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #e8f5e9; color: #2e7d32; }
        .footer { margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 16px; color: #888; font-size: 11px; text-align: center; line-height: 1.8; }
        @media print { body { padding: 20px; } @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="store-name">SHOPLIKE VINTAGE</div>
          <div class="store-tag">Premium Vintage Fashion · Est. MMXX</div>
        </div>
        <div class="receipt-title">
          OFFICIAL RECEIPT<br/>
          <span class="ref">${order.orderRef}</span><br/>
          <small style="color:#888;font-size:11px;">${date}</small>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Order Details</h3>
          <p><b>Reference:</b> ${order.orderRef}</p>
          <p><b>Date:</b> ${date}</p>
          <p><b>Status:</b> <span class="status-badge">${order.status}</span></p>
          <p><b>Payment:</b> ${order.paymentStatus}</p>
        </div>
        <div class="info-box">
          <h3>Customer & Delivery</h3>
          <p><b>${order.customerName}</b></p>
          <p>${order.customerPhone}</p>
          ${order.customerEmail ? `<p>${order.customerEmail}</p>` : ""}
          <p style="margin-top:6px;">${order.shippingAddress?.address || ""}</p>
          <p>${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}, Nigeria</p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${items.map((i: any) => `
            <tr>
              <td>${i.name}</td>
              <td>${i.size || "–"}</td>
              <td>${i.qty}</td>
              <td>₦${Number(i.price).toLocaleString()}</td>
              <td>₦${(i.price * i.qty).toLocaleString()}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="4" style="text-align:right;">TOTAL</td>
            <td>₦${Number(order.total).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Thank you for shopping with <b>Shoplike Vintage</b>!<br/>
        Questions? Call or WhatsApp: <b>09063172596</b> · Email: Shoplikevintagevintage@gmail.com<br/>
        This serves as your official purchase receipt. Please keep for your records.
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export default function OrderSuccessPage() {
  const { ref } = useParams<{ ref: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    fetch(`${BASE}/api/orders/track?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setOrder(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ref]);

  const whatsapp = "09063172596";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Order Placed!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for shopping with Shoplike Vintage.
        </p>
      </div>

      {/* Order Ref */}
      {ref && (
        <div className="bg-muted rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your order reference</p>
          <p className="font-mono font-bold text-2xl text-primary" data-testid="text-order-ref">{ref}</p>
          <p className="text-xs text-muted-foreground mt-2">Screenshot this reference to track your order</p>
        </div>
      )}

      {/* Order Details (if fetched) */}
      {!loading && order && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Package size={18} /> Order Summary</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => printReceipt(order)}>
                <Printer size={14} className="mr-1.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={() => printReceipt(order)}>
                <Download size={14} className="mr-1.5" /> Download PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-11 h-13 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                  <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                </div>
                <p className="font-semibold text-primary text-sm shrink-0">₦{(item.price * item.qty).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">₦{Number(order.total).toLocaleString()}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5"><Truck size={14} /> Delivering to: <span className="text-foreground font-medium">{order.shippingAddress?.city}, {order.shippingAddress?.state}</span></p>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-6 text-center">
        We will contact you on WhatsApp or phone to confirm your delivery details.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={`https://wa.me/234${whatsapp.replace(/^0/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
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
            <ShoppingBag size={18} /> Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
