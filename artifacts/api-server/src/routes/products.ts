import { Router, type IRouter } from "express";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  GetProductsQueryParams,
  GetProductResponse,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  GetFeaturedProductsQueryParams,
  GetProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = GetProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { section, categoryId, search, sale, page = 1, limit = 20 } = parsed.data;

  const conditions: ReturnType<typeof eq>[] = [];
  if (section) conditions.push(eq(productsTable.section, section));
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (sale) conditions.push(eq(productsTable.isOnSale, true));

  const whereClause = search
    ? and(...conditions, ilike(productsTable.name, `%${search}%`))
    : conditions.length > 0
    ? and(...conditions)
    : undefined;

  const offset = (page - 1) * limit;

  const [products, countResult] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(whereClause)
      .orderBy(desc(productsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  res.json({
    products: products.map(normalizeProduct),
    total,
    page,
    limit,
  });
});

router.get("/products/featured", async (req, res): Promise<void> => {
  const parsed = GetFeaturedProductsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isFeatured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);

  res.json(products.map(normalizeProduct));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(normalizeProduct(product)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      name: data.name,
      description: data.description ?? null,
      price: String(data.price),
      comparePrice: data.comparePrice != null ? String(data.comparePrice) : null,
      section: data.section,
      categoryId: data.categoryId ?? null,
      inStock: data.inStock ?? true,
      stockQty: data.stockQty ?? null,
      sizes: data.sizes ?? null,
      colors: data.colors ?? null,
      images: data.images ?? null,
      videoUrl: data.videoUrl ?? null,
      isFeatured: data.isFeatured ?? false,
      isOnSale: data.isOnSale ?? false,
    })
    .returning();

  res.status(201).json(GetProductResponse.parse(normalizeProduct(product)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateValues: Record<string, unknown> = {};
  if (data.name !== undefined) updateValues.name = data.name;
  if (data.description !== undefined) updateValues.description = data.description;
  if (data.price !== undefined) updateValues.price = String(data.price);
  if (data.comparePrice !== undefined) updateValues.comparePrice = data.comparePrice != null ? String(data.comparePrice) : null;
  if (data.section !== undefined) updateValues.section = data.section;
  if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
  if (data.inStock !== undefined) updateValues.inStock = data.inStock;
  if (data.stockQty !== undefined) updateValues.stockQty = data.stockQty;
  if (data.sizes !== undefined) updateValues.sizes = data.sizes;
  if (data.colors !== undefined) updateValues.colors = data.colors;
  if (data.images !== undefined) updateValues.images = data.images;
  if (data.videoUrl !== undefined) updateValues.videoUrl = data.videoUrl;
  if (data.isFeatured !== undefined) updateValues.isFeatured = data.isFeatured;
  if (data.isOnSale !== undefined) updateValues.isOnSale = data.isOnSale;

  const [product] = await db
    .update(productsTable)
    .set(updateValues)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(normalizeProduct(product)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ success: true });
});

function normalizeProduct(p: typeof productsTable.$inferSelect) {
  return {
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
