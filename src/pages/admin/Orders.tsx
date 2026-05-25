import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Eye, X, MapPin, Phone, Mail, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const PAGE_SIZE = 20;

async function fetchOrders(status: string, page: number) {
  let q = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const from = (page - 1) * PAGE_SIZE;
  q = q.range(from, from + PAGE_SIZE - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { orders: data || [], total: count || 0 };
}

async function updateOrderStatus(id: number, status: string) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["sb-orders", statusFilter, page],
    queryFn: () => fetchOrders(statusFilter, page),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: (updated, variables) => {
      qc.invalidateQueries({ queryKey: ["sb-orders"] });
      if (selectedOrder?.id === variables.id) {
        setSelectedOrder((prev: any) => ({ ...prev, status: variables.status }));
      }
      toast({ title: `Order status updated to ${variables.status}` });
    },
    onError: (e: any) =>
      toast({ title: "Failed to update status", description: e.message, variant: "destructive" }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">{total} total order{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {["", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order Ref</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Payment</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
                : orders.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <p className="font-medium">No orders found</p>
                      <p className="text-sm mt-1">Orders will appear here once customers place them.</p>
                    </td>
                  </tr>
                )
                : orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{o.order_ref}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(o.created_at).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">₦{Number(o.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[o.status] || ""}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        o.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded hover:bg-muted"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center text-sm px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
                <p className="font-mono font-bold text-lg">{selectedOrder.order_ref}</p>
              </div>

              {/* Customer Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Details</p>
                <div className="flex items-center gap-2 text-sm">
                  <Package size={14} className="text-primary" />
                  <span className="font-medium">{selectedOrder.customer_name}</span>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-primary" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                )}
                {selectedOrder.customer_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-primary" />
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Delivery Address</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p>{selectedOrder.shipping_address.address}</p>
                      <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                      <p>{selectedOrder.shipping_address.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="w-12 h-14 rounded bg-muted overflow-hidden shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full" />
                        }
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                          <span>Qty: {item.qty}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-primary">₦{(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total + Status */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Order Total</p>
                  <p className="text-2xl font-bold text-primary">₦{Number(selectedOrder.total).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus.mutate({ id: selectedOrder.id, status: e.target.value })}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium border border-border cursor-pointer ${STATUS_COLORS[selectedOrder.status] || ""}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
