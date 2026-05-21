import { Router, type IRouter } from "express";
import { gte, sql, eq } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import { GetSalesStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totals] = await db.select({
    totalOrders: sql<number>`count(*)::int`,
    totalRevenue: sql<number>`coalesce(sum(total::numeric), 0)`,
    pendingOrders: sql<number>`count(*) filter (where status = 'pending')::int`,
  }).from(ordersTable);

  const [todayStats] = await db.select({
    todayOrders: sql<number>`count(*)::int`,
    todayRevenue: sql<number>`coalesce(sum(total::numeric), 0)`,
  }).from(ordersTable).where(gte(ordersTable.createdAt, today));

  const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);

  res.json({
    totalRevenue: Number(totals?.totalRevenue ?? 0),
    totalOrders: Number(totals?.totalOrders ?? 0),
    pendingOrders: Number(totals?.pendingOrders ?? 0),
    totalProducts: Number(productCount?.count ?? 0),
    todayOrders: Number(todayStats?.todayOrders ?? 0),
    todayRevenue: Number(todayStats?.todayRevenue ?? 0),
    topProducts: [],
  });
});

router.get("/dashboard/sales", async (req, res): Promise<void> => {
  const parsed = GetSalesStatsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.select({
    date: sql<string>`date_trunc('day', created_at)::date::text`,
    revenue: sql<number>`coalesce(sum(total::numeric), 0)`,
    orders: sql<number>`count(*)::int`,
  })
  .from(ordersTable)
  .where(gte(ordersTable.createdAt, since))
  .groupBy(sql`date_trunc('day', created_at)`)
  .orderBy(sql`date_trunc('day', created_at)`);

  res.json(rows.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })));
});

export default router;
