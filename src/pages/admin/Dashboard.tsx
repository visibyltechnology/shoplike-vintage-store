import { useGetDashboardStats, useGetSalesStats } from "@/lib/api-client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingCart, Package, Clock, DollarSign, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: salesData } = useGetSalesStats();

  const statCards = stats
    ? [
        { label: "Total Revenue", value: `₦${Number(stats.totalRevenue).toLocaleString()}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
        { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-secondary/20 text-secondary-foreground" },
        { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "bg-accent/20 text-accent" },
        { label: "Total Products", value: stats.totalProducts, icon: Package, color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
        { label: "Today's Orders", value: stats.todayOrders, icon: Calendar, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
        { label: "Today's Revenue", value: `₦${Number(stats.todayRevenue).toLocaleString()}`, icon: TrendingUp, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back to Shoplike Vintage admin</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5" data-testid={`stat-card-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon size={20} />
              </div>
              <p className="text-2xl font-bold" data-testid={`stat-value-${card.label.toLowerCase().replace(/\s/g, "-")}`}>{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sales Chart */}
      {salesData && salesData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Sales (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(184, 60%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(184, 60%, 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(184, 60%, 28%)" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Top Selling Products</h2>
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3" data-testid={`top-product-${p.id}`}>
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.totalSold} sold</p>
                  </div>
                  <span className="text-sm font-bold text-primary">₦{Number(p.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders Link */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
          <ShoppingCart size={32} className="text-muted-foreground" />
          <div>
            <p className="font-semibold">Manage Orders</p>
            <p className="text-sm text-muted-foreground">View and update customer orders</p>
          </div>
          <Link href="/admin/orders" className="text-primary text-sm font-medium hover:underline" data-testid="link-view-all-orders">View all orders →</Link>
        </div>
      </div>
    </div>
  );
}
