import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useCreateOrder, useInitiatePayment } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", address: "", city: "", state: "Lagos", country: "Nigeria",
  });
  const [paymentMethod, setPaymentMethod] = useState<"korapay" | "delivery">("korapay");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (paymentMethod === "korapay" && !form.email.trim()) e.email = "Email required for online payment";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xl text-muted-foreground">Your cart is empty.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const orderData = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          size: i.size || null,
          color: i.color || null,
          imageUrl: i.imageUrl || null,
        })),
        shippingAddress: { ...form },
        total,
        notes: null,
      };

      const order = await new Promise<any>((resolve, reject) => {
        createOrder.mutate({ data: orderData }, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      if (paymentMethod === "korapay") {
        const payData = await new Promise<any>((resolve, reject) => {
          initiatePayment.mutate({
            data: {
              orderId: order.id,
              amount: total,
              email: form.email,
              name: form.fullName,
              phone: form.phone || null,
            }
          }, {
            onSuccess: resolve,
            onError: reject,
          });
        });
        clearCart();
        window.location.href = payData.checkoutUrl;
      } else {
        clearCart();
        setLocation(`/order-success/${order.orderRef}`);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          {/* Delivery Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Truck size={18} /> Delivery Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.fullName ? "border-destructive" : "border-border"} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                  data-testid="input-full-name"
                />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08012345678"
                  className={`w-full px-3 py-2 rounded-lg border ${errors.phone ? "border-destructive" : "border-border"} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                  data-testid="input-phone"
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email {paymentMethod === "korapay" ? "*" : "(optional)"}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.email ? "border-destructive" : "border-border"} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                  data-testid="input-email"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Delivery Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.address ? "border-destructive" : "border-border"} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  data-testid="input-address"
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City *</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.city ? "border-destructive" : "border-border"} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                  data-testid="input-city"
                />
                {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="select-state"
                >
                  {NIGERIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Payment Method</h2>
            <div className="space-y-3">
              {/* Korapay */}
              <label
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "korapay" ? "border-[#0D6B58] bg-[#0D6B58]/5" : "border-border hover:border-[#0D6B58]/40"}`}
                data-testid="label-korapay"
              >
                <input
                  type="radio"
                  value="korapay"
                  checked={paymentMethod === "korapay"}
                  onChange={() => setPaymentMethod("korapay")}
                  className="accent-[#0D6B58]"
                  data-testid="radio-korapay"
                />
                <div className="flex items-center gap-3 flex-1">
                  <img src="/korapay-logo.svg" alt="Korapay" className="h-7 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <p className="font-semibold text-sm">Pay with Korapay</p>
                    <p className="text-xs text-muted-foreground">Card, bank transfer, USSD & more</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="text-[10px] bg-[#0D6B58]/10 text-[#0D6B58] font-semibold px-2 py-0.5 rounded">SECURE</span>
                </div>
              </label>

              {/* Pay on Delivery */}
              <label
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                data-testid="label-delivery"
              >
                <input
                  type="radio"
                  value="delivery"
                  checked={paymentMethod === "delivery"}
                  onChange={() => setPaymentMethod("delivery")}
                  data-testid="radio-delivery"
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Pay on Delivery</p>
                    <p className="text-xs text-muted-foreground">Cash on delivery (select areas)</p>
                  </div>
                </div>
              </label>
            </div>

            {paymentMethod === "korapay" && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                You'll be redirected to Korapay's secure checkout to complete your payment. Your order will be confirmed after payment.
              </p>
            )}
            {paymentMethod === "delivery" && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                Pay in cash when your order arrives. Available in select areas. Our team will contact you to confirm delivery.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground text-lg py-6"
            data-testid="button-place-order"
          >
            {loading ? "Processing..." : `Place Order — ₦${total.toLocaleString()}`}
          </Button>
        </form>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-4">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                <div className="w-12 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium line-clamp-2">{item.name}</p>
                  {item.size && <p className="text-muted-foreground text-xs">Size: {item.size}</p>}
                  <p className="text-primary font-semibold">₦{(item.price * item.qty).toLocaleString()} × {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span className="text-green-600 font-medium">Calculated at delivery</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span className="text-primary" data-testid="text-checkout-total">₦{total.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <img src="/korapay-logo.svg" alt="Korapay" className="h-4 w-auto opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span>Secured by Korapay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
