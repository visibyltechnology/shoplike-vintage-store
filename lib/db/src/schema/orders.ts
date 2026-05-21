import { pgTable, serial, text, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderRef: text("order_ref").notNull().unique(),
  items: jsonb("items").notNull().$type<Array<{
    productId: number;
    name: string;
    price: number;
    qty: number;
    size?: string | null;
    color?: string | null;
    imageUrl?: string | null;
  }>>(),
  shippingAddress: jsonb("shipping_address").notNull().$type<{
    fullName: string;
    phone: string;
    email?: string | null;
    address: string;
    city: string;
    state: string;
    country: string;
  }>(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentMethod: text("payment_method"),
  paymentRef: text("payment_ref"),
  notes: text("notes"),
  customerId: integer("customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
