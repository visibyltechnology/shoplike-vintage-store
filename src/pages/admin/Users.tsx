import { useState } from "react";
import { User, Search, Shield, ShieldOff, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

function useProfiles(page: number, search: string) {
  return useQuery({
    queryKey: ["admin-profiles", page, search],
    queryFn: async () => {
      let q = supabase.from("user_profiles").select("*", { count: "exact" });
      if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      const limit = 20;
      q = q.range((page - 1) * limit, page * limit - 1).order("created_at", { ascending: false });
      const { data, error, count } = await q;
      if (error) throw error;
      return { profiles: data ?? [], total: count ?? 0 };
    },
  });
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useProfiles(page, search);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const restrictMutation = useMutation({
    mutationFn: async ({ id, restrict }: { id: string; restrict: boolean }) => {
      const { error } = await supabase.from("user_profiles").update({ is_restricted: restrict }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { restrict }) => {
      toast({ title: restrict ? "User restricted" : "User unrestricted" });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User profile removed" });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const fmt = (s: string) => new Date(s).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} registered customers</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
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
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={5}><Skeleton className="h-14 w-full rounded-none" /></td></tr>
                  ))
                : (data?.profiles ?? []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.is_restricted ? "bg-destructive/10" : "bg-primary/10"}`}>
                            <User size={14} className={c.is_restricted ? "text-destructive" : "text-primary"} />
                          </div>
                          <div>
                            <p className="font-medium">{c.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.phone || "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_restricted ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
                          {c.is_restricted ? "Restricted" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {c.created_at ? fmt(c.created_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={c.is_restricted ? "Unrestrict" : "Restrict"}
                            onClick={() => restrictMutation.mutate({ id: c.id, restrict: !c.is_restricted })}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            {c.is_restricted ? <Shield size={14} className="text-green-600" /> : <ShieldOff size={14} className="text-amber-500" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete profile"
                            onClick={() => {
                              if (confirm("Remove this user profile?")) deleteMutation.mutate(c.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
              {!isLoading && (data?.profiles ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No customers yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Customers appear here after they sign up.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="flex items-center text-sm px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
