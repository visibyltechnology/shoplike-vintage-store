import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, settingsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "shoplike-secret-key";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "shoplike2024";

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password } = parsed.data;

  const [settings] = await db.select({ adminPasswordHash: settingsTable.adminPasswordHash }).from(settingsTable);

  let valid = false;
  if (settings?.adminPasswordHash) {
    valid = await bcrypt.compare(password, settings.adminPasswordHash);
  } else {
    valid = password === DEFAULT_ADMIN_PASSWORD;
  }

  if (!valid) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

export default router;
