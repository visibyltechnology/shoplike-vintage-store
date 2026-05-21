import { pgTable, serial, text, numeric, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric("compare_price", { precision: 12, scale: 2 }),
  section: text("section").notNull(),
  categoryId: integer("category_id"),
  inStock: boolean("in_stock").notNull().default(true),
  stockQty: integer("stock_qty"),
  sizes: jsonb("sizes").$type<string[]>(),
  colors: jsonb("colors").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  videoUrl: text("video_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isOnSale: boolean("is_on_sale").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
