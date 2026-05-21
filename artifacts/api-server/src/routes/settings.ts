import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable);

  if (!settings) {
    const [created] = await db
      .insert(settingsTable)
      .values({ storeName: "Shoplike Vintage", whatsappNumber: "09063172596", currency: "NGN" })
      .returning();
    settings = created;
  }

  res.json(normalizeSettings(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [existing] = await db.select({ id: settingsTable.id }).from(settingsTable);

  let settings;
  if (!existing) {
    const [created] = await db.insert(settingsTable).values({ storeName: "Shoplike Vintage", ...parsed.data }).returning();
    settings = created;
  } else {
    const [updated] = await db.update(settingsTable).set(parsed.data).returning();
    settings = updated;
  }

  res.json(normalizeSettings(settings));
});

function normalizeSettings(s: typeof settingsTable.$inferSelect) {
  const { adminPasswordHash: _omit, ...rest } = s;
  return rest;
}

export default router;
