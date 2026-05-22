import { Router, type IRouter } from "express";
  import { eq, desc, ilike, or, sql } from "drizzle-orm";
  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";
  import { db, customersTable, ordersTable } from "@workspace/db";
  import {
    CustomerSignupBody,
    CustomerLoginBody,
  } from "@workspace/api-zod";

  const router: IRouter = Router();
  const JWT_SECRET = process.env.SESSION_SECRET ?? "shoplike-secret-key";

  router.post("/customers/signup", async (req, res): Promise<void> => {
    try {
      const parsed = CustomerSignupBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Please check all required fields." });
        return;
      }
      const { name, email, password, phone } = parsed.data;
      const [existing] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.email, email));
      if (existing) {
        res.status(409).json({ error: "Email already registered. Please log in." });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const [customer] = await db.insert(customersTable).values({ name, email, passwordHash, phone: phone ?? null }).returning();
      const token = jwt.sign({ customerId: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: "30d" });
      res.status(201).json({
        token,
        customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, createdAt: customer.createdAt.toISOString() },
      });
    } catch {
      res.status(500).json({ error: "Sign up failed. Please try again." });
    }
  });

  router.post("/customers/login", async (req, res): Promise<void> => {
    try {
      const parsed = CustomerLoginBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Please enter a valid email and password." });
        return;
      }
      const { email, password } = parsed.data;
      const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
      if (!customer) { res.status(401).json({ error: "Invalid email or password" }); return; }
      const valid = await bcrypt.compare(password, customer.passwordHash);
      if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }
      const token = jwt.sign({ customerId: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: "30d" });
      res.json({
        token,
        customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, createdAt: customer.createdAt.toISOString() },
      });
    } catch {
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  router.get("/customers/me/orders", async (req, res): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
    const token = authHeader.slice(7);
    let payload: { customerId: number };
    try { payload = jwt.verify(token, JWT_SECRET) as { customerId: number }; }
    catch { res.status(401).json({ error: "Invalid token" }); return; }
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.customerId, payload.customerId)).orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(o => ({ ...o, total: Number(o.total), createdAt: o.createdAt.toISOString() })));
  });

  // Admin: list customers with search + order count
  router.get("/customers", async (req, res): Promise<void> => {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
    const search = String(req.query.search || "").trim();
    const offset = (page - 1) * limit;
    const whereClause = search ? or(ilike(customersTable.name, `%${search}%`), ilike(customersTable.email, `%${search}%`)) : undefined;
    const [customers, countResult] = await Promise.all([
      db.select().from(customersTable).where(whereClause).orderBy(desc(customersTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(whereClause),
    ]);
    const ids = customers.map(c => c.id);
    let orderCounts: { customerId: number | null; count: number }[] = [];
    if (ids.length > 0) {
      orderCounts = await db
        .select({ customerId: ordersTable.customerId, count: sql<number>`count(*)::int` })
        .from(ordersTable)
        .where(sql`${ordersTable.customerId} = ANY(${sql.raw("ARRAY[" + ids.join(',') + "]::int[]")})`)
        .groupBy(ordersTable.customerId);
    }
    const countMap = Object.fromEntries(orderCounts.map(r => [r.customerId, r.count]));
    res.json({
      customers: customers.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, createdAt: c.createdAt.toISOString(), orderCount: countMap[c.id] ?? 0 })),
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    });
  });

  router.post("/customers/forgot-password", async (_req, res): Promise<void> => {
    res.json({ message: "If that email exists, a reset link has been sent." });
  });

  export default router;
  