import { Router, type IRouter } from "express";
  import { eq } from "drizzle-orm";
  import crypto from "node:crypto";
  import { db, ordersTable, settingsTable } from "@workspace/db";
  import { InitiatePaymentBody, VerifyPaymentParams } from "@workspace/api-zod";

  const router: IRouter = Router();

  router.post("/payments/initiate", async (req, res): Promise<void> => {
    const parsed = InitiatePaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [settings] = await db.select().from(settingsTable);
    if (!settings?.korapayEnabled || !settings.korapaySecretKey) {
      res.status(400).json({ error: "Payment gateway not configured" });
      return;
    }

    const { orderId, amount, email, name, phone } = parsed.data;
    const reference = `SV-PAY-${Date.now()}`;

    try {
      const response = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.korapaySecretKey}`,
        },
        body: JSON.stringify({
          reference,
          amount,
          currency: settings.currency ?? "NGN",
          customer: { name, email, phone_number: phone ?? "" },
          redirect_url: `${process.env.STORE_URL ?? ""}/order-success/${reference}`,
          metadata: { orderId },
        }),
      });

      const data = await response.json() as {
        status: boolean;
        data?: { checkout_url: string };
        message?: string;
      };

      if (!data.status || !data.data?.checkout_url) {
        res.status(502).json({ error: data.message ?? "Payment initiation failed" });
        return;
      }

      await db
        .update(ordersTable)
        .set({ paymentRef: reference, paymentMethod: "korapay" })
        .where(eq(ordersTable.id, orderId));

      res.json({ checkoutUrl: data.data.checkout_url, reference });
    } catch (err) {
      res.status(502).json({ error: "Failed to reach payment gateway" });
    }
  });

  router.get("/payments/verify/:reference", async (req, res): Promise<void> => {
    const params = VerifyPaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [settings] = await db.select().from(settingsTable);
    if (!settings?.korapaySecretKey) {
      res.status(400).json({ error: "Payment gateway not configured" });
      return;
    }

    try {
      const response = await fetch(
        `https://api.korapay.com/merchant/api/v1/charges/${params.data.reference}`,
        {
          headers: { "Authorization": `Bearer ${settings.korapaySecretKey}` },
        }
      );

      const data = await response.json() as {
        status: boolean;
        data?: { status: string; amount: number; reference: string };
        message?: string;
      };

      if (!data.status || !data.data) {
        res.status(502).json({ error: data.message ?? "Verification failed" });
        return;
      }

      if (data.data.status === "success") {
        await db
          .update(ordersTable)
          .set({ paymentStatus: "paid", status: "confirmed" })
          .where(eq(ordersTable.paymentRef, params.data.reference));
      }

      res.json({
        status: data.data.status,
        amount: data.data.amount,
        reference: data.data.reference,
      });
    } catch {
      res.status(502).json({ error: "Failed to reach payment gateway" });
    }
  });

  /**
   * POST /api/payments/webhook
   * Korapay webhook — confirms payment automatically when Kora notifies us.
   * Configure this URL in your Korapay dashboard:
   *   https://<your-api-domain>/api/payments/webhook
   */
  router.post("/payments/webhook", async (req, res): Promise<void> => {
    const [settings] = await db.select().from(settingsTable);

    // Verify signature if encryption key is configured
    if (settings?.korapayEncKey) {
      const signature = req.headers["x-korapay-signature"] as string | undefined;
      if (!signature) {
        res.status(401).json({ error: "Missing webhook signature" });
        return;
      }

      const rawBody = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", settings.korapayEncKey)
        .update(rawBody)
        .digest("hex");

      if (expected !== signature) {
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }
    }

    const event = req.body as {
      event?: string;
      data?: { reference?: string; status?: string; amount?: number };
    };

    if (event.event === "charge.success" && event.data?.status === "success" && event.data.reference) {
      await db
        .update(ordersTable)
        .set({ paymentStatus: "paid", status: "confirmed" })
        .where(eq(ordersTable.paymentRef, event.data.reference));
    }

    res.json({ received: true });
  });

  export default router;
  