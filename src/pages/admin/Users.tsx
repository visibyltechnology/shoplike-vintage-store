import { useState } from "react";
  import { User, Search } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Skeleton } from "@/components/ui/skeleton";
  import { useQuery } from "@tanstack/react-query";

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  function useAdminCustomers(page: number, search: string) {
    return useQuery({
      queryKey: ["admin-customers", page, search],
      queryFn: async () => {
        const token = localStorage.getItem("sv_admin_token") || "";
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search) params.set("search", search);
        const res = await fetch(`${BASE}/api/customers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch customers");
        return res.json() as Promise<{ customers: any[]; total: number; page: number }>;
      },
    });
  }

  export default function AdminUsers() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const { data, isLoading } = useAdminCustomers(page, search);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
    const fmt = (s: string) => new Date(s).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} registered customers</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button type="submit" variant="outline" size="sm"><Search size={15} /></Button>
        </form>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Orders</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}><td colSpan={4}><Skeleton className="h-12 w-full rounded-none" /></td></tr>
                    ))
                  : (data?.customers ?? []).map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User size={14} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.phone || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{c.orderCount ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{fmt(c.createdAt)}</td>
                      </tr>
                    ))
                }
                {!isLoading && (data?.customers ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 p-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="flex items-center text-sm px-2">Page {page} of {Math.ceil(data.total / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 20)}>Next</Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  