import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
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
  const parsed = CustomerSignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, phone } = parsed.data;

  const [existing] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.email, email));

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [customer] = await db
    .insert(customersTable)
    .values({ name, email, passwordHash, phone: phone ?? null })
    .returning();

  const token = jwt.sign({ customerId: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: "30d" });

  res.status(201).json({
    token,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    },
  });
});

router.post("/customers/login", async (req, res): Promise<void> => {
  const parsed = CustomerLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, email));

  if (!customer) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ customerId: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: "30d" });

  res.json({
    token,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    },
  });
});

router.get("/customers/me/orders", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  let payload: { customerId: number };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { customerId: number };
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerId, payload.customerId))
    .orderBy(desc(ordersTable.createdAt));

  res.json(orders.map(o => ({ ...o, total: Number(o.total), createdAt: o.createdAt.toISOString() })));
});

router.post("/customers/forgot-password", async (_req, res): Promise<void> => {
  res.json({ message: "If that email exists, a reset link has been sent." });
});

export default router;
