import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { TrendingUp, ShoppingCart, Package, Clock, DollarSign, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const STATUS_COLORS_PIE: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

async function fetchDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [ordersRes, todayRes, productsRes] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at"),
    supabase.from("orders").select("id, total").gte("created_at", todayStart),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const orders = ordersRes.data || [];
  const todayOrders = todayRes.data || [];
  const totalProducts = productsRes.count || 0;

  const totalRevenue = orders
    .filter((o: any) => o.status !== "cancelled")
    .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const todayRevenue = todayOrders
    .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;

  const statusCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    totalProducts,
    todayOrders: todayOrders.length,
    todayRevenue,
    statusCounts,
    recentOrders: orders
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
  };
}

async function fetchSalesStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  if (error) return [];

  const byDay: Record<string, number> = {};
  (data || []).forEach((o: any) => {
    const day = new Date(o.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    byDay[day] = (byDay[day] || 0) + Number(o.total || 0);
  });

  return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));
}

async function fetchTopProducts() {
  const { data: orderData } = await supabase
    .from("orders")
    .select("items")
    .neq("status", "cancelled");

  const productTotals: Record<string, { name: string; qty: number; revenue: number }> = {};

  (orderData || []).forEach((o: any) => {
    (o.items || []).forEach((item: any) => {
      if (!item.name) return;
      const key = item.name;
      if (!productTotals[key]) productTotals[key] = { name: item.name, qty: 0, revenue: 0 };
      productTotals[key].qty += item.qty || 1;
      productTotals[key].revenue += (item.price || 0) * (item.qty || 1);
    });
  });

  return Object.values(productTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sb-dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 2,
  });

  const { data: salesData } = useQuery({
    queryKey: ["sb-sales-stats"],
    queryFn: fetchSalesStats,
    staleTime: 1000 * 60 * 2,
  });

  const { data: topProducts } = useQuery({
    queryKey: ["sb-top-products"],
    queryFn: fetchTopProducts,
    staleTime: 1000 * 60 * 2,
  });

  const statCards = stats
    ? [
        { label: "Total Revenue", value: `₦${Number(stats.totalRevenue).toLocaleString()}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
        { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-secondary/20 text-secondary-foreground" },
        { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
        { label: "Total Products", value: stats.totalProducts, icon: Package, color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
        { label: "Today's Orders", value: stats.todayOrders, icon: Calendar, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
        { label: "Today's Revenue", value: `₦${Number(stats.todayRevenue).toLocaleString()}`, icon: TrendingUp, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
      ]
    : [];

  const pieData = stats
    ? Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value }))
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
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon size={20} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales Area Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Sales — Last 30 Days</h2>
          {salesData && salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(184, 60%, 28%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(184, 60%, 28%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(184, 60%, 28%)" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No sales data yet
            </div>
          )}
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Orders by Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS_PIE[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Legend
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No order data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Products Bar Chart */}
      {topProducts && topProducts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Top Selling Products (by Revenue)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} margin={{ top: 5, right: 5, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              />
              <Bar dataKey="revenue" fill="hsl(184, 60%, 28%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products List */}
        {topProducts && topProducts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Top Selling Products</h2>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-bold text-primary">₦{Number(p.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage Orders Quick Link */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
          <ShoppingCart size={32} className="text-muted-foreground" />
          <div>
            <p className="font-semibold">Manage Orders</p>
            <p className="text-sm text-muted-foreground">View and update customer orders</p>
          </div>
          <Link href="/admin/orders" className="text-primary text-sm font-medium hover:underline">
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
