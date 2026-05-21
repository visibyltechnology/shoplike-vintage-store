import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Package, LogOut, User, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomerUser, getCustomerToken, clearCustomerSession, isCustomerLoggedIn } from "@/pages/CustomerAuthPage";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-700 bg-yellow-100",
  confirmed: "text-blue-700 bg-blue-100",
  processing: "text-purple-700 bg-purple-100",
  shipped: "text-indigo-700 bg-indigo-100",
  delivered: "text-green-700 bg-green-100",
  cancelled: "text-red-700 bg-red-100",
};

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCustomerUser();

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      setLocation("/login");
      return;
    }
    const token = getCustomerToken();
    fetch(`${BASE}/api/customers/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearCustomerSession();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut size={16} /> Sign Out
        </Button>
      </div>

      {/* Orders */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
          <Package size={20} className="text-primary" /> My Orders
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Your orders will appear here once you shop.</p>
            <Link href="/shop">
              <Button className="mt-4">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/track-order?ref=${encodeURIComponent(order.orderRef)}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {order.status === "delivered" ? <CheckCircle size={20} className="text-green-600" /> :
                     order.status === "shipped" ? <Truck size={20} className="text-indigo-600" /> :
                     order.status === "cancelled" ? <XCircle size={20} className="text-destructive" /> :
                     <Clock size={20} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-sm text-primary">{order.orderRef}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status] || "text-gray-700 bg-gray-100"}`}>
                      {order.status}
                    </span>
                    <p className="font-bold text-primary text-sm hidden sm:block">₦{Number(order.total).toLocaleString()}</p>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
