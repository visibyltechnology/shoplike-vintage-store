import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Shoplike Vintage"),
  storeEmail: text("store_email"),
  storePhone: text("store_phone"),
  whatsappNumber: text("whatsapp_number").default("09063172596"),
  currency: text("currency").notNull().default("NGN"),
  korapayEnabled: boolean("korapay_enabled").notNull().default(false),
  korapayPublicKey: text("korapay_public_key"),
  korapaySecretKey: text("korapay_secret_key"),
  korapayEncKey: text("korapay_enc_key"),
  smsApiKey: text("sms_api_key"),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  emailApiKey: text("email_api_key"),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  bannerText: text("banner_text"),
  bannerEnabled: boolean("banner_enabled").notNull().default(false),
  adminPasswordHash: text("admin_password_hash"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
