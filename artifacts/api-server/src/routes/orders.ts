import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, ordersTable, settingsTable } from "@workspace/db";
import {
  GetOrdersQueryParams,
  CreateOrderBody,
  TrackOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { nanoid } from "../lib/nanoid.js";

const router: IRouter = Router();

async function sendBulkSMS(phone: string, message: string, apiKey: string): Promise<void> {
  try {
    const params = new URLSearchParams({
      api_token: apiKey,
      from: "ShoplikeVin",
      to: phone.replace(/^0/, "234").replace(/^\+/, ""),
      body: message,
    });
    await fetch(`https://www.bulksmsnigeria.com/api/v2/sms?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    // SMS failure is non-fatal
  }
}

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "Your Shoplike Vintage order has been confirmed! We're preparing it for dispatch.",
  shipped: "Great news! Your Shoplike Vintage order is on the way. You'll receive it soon.",
  delivered: "Your Shoplike Vintage order has been delivered. Thank you for shopping with us!",
  cancelled: "Your Shoplike Vintage order has been cancelled. Contact us on WhatsApp: 09063172596 for help.",
};

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = GetOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const whereClause = status ? eq(ordersTable.status, status) : undefined;

  const [orders, countResult] = await Promise.all([
    db
      .select()
      .from(ordersTable)
      .where(whereClause)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(whereClause),
  ]);

  res.json({
    orders: orders.map(normalizeOrder),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, shippingAddress, total, notes, paymentMethod, customerId } = parsed.data;
  const orderRef = `SV-${nanoid(8).toUpperCase()}`;

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderRef,
      items,
      shippingAddress,
      total: String(total),
      notes: notes ?? null,
      paymentMethod: paymentMethod ?? null,
      customerId: customerId ?? null,
      status: "pending",
      paymentStatus: "unpaid",
    })
    .returning();

  // Send confirmation SMS if enabled
  const [settings] = await db.select().from(settingsTable);
  if (settings?.smsEnabled && settings.smsApiKey) {
    const phone = (shippingAddress as any)?.phone;
    if (phone) {
      const msg = `Hi ${(shippingAddress as any)?.fullName || "Customer"}, your Shoplike Vintage order ${orderRef} has been received! Total: NGN ${Number(total).toLocaleString()}. We'll update you on delivery.`;
      await sendBulkSMS(phone, msg, settings.smsApiKey);
    }
  }

  res.status(201).json(normalizeOrder(order));
});

router.get("/orders/track/:ref", async (req, res): Promise<void> => {
  const params = TrackOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderRef, params.data.ref));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(normalizeOrder(order));
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Send SMS notification on status change
  const [settings] = await db.select().from(settingsTable);
  if (settings?.smsEnabled && settings.smsApiKey) {
    const phone = (order.shippingAddress as any)?.phone;
    const message = STATUS_MESSAGES[parsed.data.status];
    if (phone && message) {
      await sendBulkSMS(phone, message, settings.smsApiKey);
    }
  }

  res.json(normalizeOrder(order));
});

function normalizeOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
  };
}

export default router;
