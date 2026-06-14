import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck, ShieldCheck, Lock, Smartphone, Building2 } from "lucide-react";
import { useLocation } from "wouter";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const BANK_ACCOUNT = {
  bank: "Moniepoint",
  accountNumber: "9063172596",
  accountName: "Shoplike Vintage",
};

const WHATSAPP_NUMBER = "2349063172596";

function generateRef(): string {
  return `SV-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

export default function CheckoutPage() {
  const { items, total } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", address: "", city: "", state: "Lagos",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.address.trim()) e.address = "Delivery address is required";
    if (!form.city.trim()) e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Smartphone size={36} className="text-muted-foreground" />
        </div>
        <p className="text-xl text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => setLocation("/shop")}>Continue Shopping</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const orderRef = generateRef();

    try {
      const { error: orderErr } = await supabase.from("orders").insert({
        order_ref: orderRef,
        customer_name: form.fullName,
        customer_email: form.email || null,
        customer_phone: form.phone,
        shipping_address: {
          address: form.address,
          city: form.city,
          state: form.state,
          country: "Nigeria",
        },
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          size: i.size || null,
          color: i.color || null,
          imageUrl: i.imageUrl || null,
        })),
        total,
        status: "pending",
        payment_status: "pending",
      });
      if (orderErr) throw new Error("Could not save your order: " + orderErr.message);

      setLocation(`/order-success/${orderRef}`);
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Order Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const inputCls = (field?: string) =>
    `w-full px-3 py-2.5 rounded-xl border ${
      field && errors[field] ? "border-destructive ring-1 ring-destructive" : "border-border"
    } bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground text-sm mb-8 flex items-center gap-1.5">
        <Lock size={13} /> Fill in your details — we'll show you how to pay after
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          {/* Delivery Details */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Truck size={18} className="text-primary" /> Delivery Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm({...form, fullName: e.target.value})}
                  className={inputCls("fullName")}
                  placeholder="As on your ID"
                />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="08012345678"
                  className={inputCls("phone")}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="you@example.com"
                  className={inputCls("email")}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Delivery Address *</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  rows={2}
                  placeholder="House number, street name, landmark..."
                  className={inputCls("address") + " resize-none"}
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">City *</label>
                <input
                  value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})}
                  className={inputCls("city")}
                  placeholder="e.g. Kano"
                />
                {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">State *</label>
                <select
                  value={form.state}
                  onChange={e => setForm({...form, state: e.target.value})}
                  className={inputCls()}
                >
                  {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Preview */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Building2 size={18} className="text-primary" /> Payment Method
            </h2>
            <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Bank Transfer (Moniepoint)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transfer to our account, then send payment proof on WhatsApp to confirm your order.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2"><span className="text-muted-foreground w-28">Bank:</span><span className="font-semibold">{BANK_ACCOUNT.bank}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-28">Account No:</span><span className="font-mono font-bold text-primary">{BANK_ACCOUNT.accountNumber}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-28">Account Name:</span><span className="font-semibold">{BANK_ACCOUNT.accountName}</span></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
              <ShieldCheck size={14} className="text-green-500 shrink-0" />
              After placing your order, you'll see the full payment details and a WhatsApp button to send your proof.
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white text-base font-bold py-6 rounded-2xl flex items-center justify-center gap-2"
            data-testid="button-place-order"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Saving your order…
              </>
            ) : (
              <>
                <Lock size={16} /> Place Order — ₦{total.toLocaleString()}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            Your order is saved instantly. Payment is confirmed after bank transfer.
          </p>
        </form>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-4">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3">
                <div className="w-12 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.imageUrl && (
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                <div className="flex-1 text-sm min-w-0">
                  <p className="font-medium line-clamp-2 leading-snug">{item.name}</p>
                  {item.size && <p className="text-muted-foreground text-xs">Size: {item.size}</p>}
                  {item.color && <p className="text-muted-foreground text-xs">Color: {item.color}</p>}
                  <p className="text-primary font-semibold text-xs mt-0.5">
                    ₦{(item.price * item.qty).toLocaleString()} × {item.qty}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span>
              <span className="text-green-600 font-medium">Calculated on delivery</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary" data-testid="text-checkout-total">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
            <ShieldCheck size={13} className="text-green-500" />
            <span>Pay via Moniepoint Bank Transfer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
