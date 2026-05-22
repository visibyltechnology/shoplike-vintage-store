import { useState } from "react";
  import { Eye, X } from "lucide-react";
  import { useGetOrders } from "@/lib/api-client";
  import { Button } from "@/components/ui/button";
  import { Skeleton } from "@/components/ui/skeleton";

  const PAY_COLORS: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    unpaid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    refunded: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
  const METHOD_LABEL: Record<string, string> = {
    korapay: "Korapay",
    delivery: "Pay on Delivery",
  };

  export default function AdminPayments() {
    const [page, setPage] = useState(1);
    const [payFilter, setPayFilter] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const { data, isLoading } = useGetOrders({ page, limit: 50 });

    const allOrders = data?.orders ?? [];
    const filtered = payFilter ? allOrders.filter((o: any) => o.paymentStatus === payFilter) : allOrders;
    const fmt = (s: string) => new Date(s).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Payment Events</h1>
          <p className="text-muted-foreground text-sm">Korapay webhook confirmations &amp; payment records</p>
        </div>

        <div className="flex gap-2">
          {[["", "All"], ["paid", "Paid"], ["unpaid", "Unpaid"]].map(([val, label]) => (
            <button key={val} onClick={() => setPayFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${payFilter === val ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            >{label}</button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Order Ref</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={7}><Skeleton className="h-12 w-full rounded-none" /></td></tr>
                    ))
                  : filtered.map((o: any) => (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{o.orderRef}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.shippingAddress?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{o.shippingAddress?.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">₦{Number(o.total).toLocaleString()}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[o.paymentStatus] ?? "bg-muted text-muted-foreground"}`}>{o.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{fmt(o.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelected(o)} className="p-1.5 rounded hover:bg-muted transition-colors"><Eye size={15} /></button>
                        </td>
                      </tr>
                    ))
                }
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No payment records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > 50 && (
            <div className="flex justify-center gap-2 p-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="flex items-center text-sm px-2">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={(data?.orders?.length ?? 0) < 50}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-semibold">Payment — {selected.orderRef}</h3>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-muted"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground text-xs mb-0.5">Payment Status</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[selected.paymentStatus] ?? ""}`}>{selected.paymentStatus}</span></div>
                  <div><p className="text-muted-foreground text-xs mb-0.5">Method</p><p className="font-medium">{METHOD_LABEL[selected.paymentMethod] ?? selected.paymentMethod ?? "—"}</p></div>
                  <div><p className="text-muted-foreground text-xs mb-0.5">Amount</p><p className="font-semibold text-primary">₦{Number(selected.total).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs mb-0.5">Order Status</p><p className="font-medium capitalize">{selected.status}</p></div>
                </div>
                {selected.paymentRef && (
                  <div><p className="text-muted-foreground text-xs mb-0.5">Payment Reference</p><p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{selected.paymentRef}</p></div>
                )}
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs mb-1">Customer</p>
                  <p className="font-medium">{selected.shippingAddress?.fullName}</p>
                  <p className="text-muted-foreground text-xs">{selected.shippingAddress?.phone}</p>
                  {selected.shippingAddress?.email && <p className="text-muted-foreground text-xs">{selected.shippingAddress.email}</p>}
                  <p className="text-muted-foreground text-xs mt-0.5">{selected.shippingAddress?.address}, {selected.shippingAddress?.city}, {selected.shippingAddress?.state}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs mb-2">Items ({selected.items?.length ?? 0})</p>
                  {(selected.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span>{item.name} × {item.qty}{item.size ? ` (${item.size})` : ""}{item.color ? ` [${item.color}]` : ""}</span>
                      <span className="font-medium shrink-0 ml-4">₦{Number(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  