import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { merchantsTable, productsTable, categoriesTable, highlightsTable, productLikesTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

async function formatProduct(r: typeof productsTable.$inferSelect, userId?: string) {
  let isLikedByMe = false;
  if (userId) {
    const like = await db.select().from(productLikesTable).where(
      and(eq(productLikesTable.userId, userId), eq(productLikesTable.productId, r.id))
    );
    isLikedByMe = like.length > 0;
  }
  return {
    id: r.id,
    merchantId: r.merchantId,
    slug: r.slug,
    title: r.title,
    description: r.description,
    price: r.price,
    originalPrice: r.originalPrice,
    currency: r.currency,
    images: r.images,
    category: r.category,
    tags: r.tags,
    likes: r.likes,
    comments: r.comments,
    shares: r.shares,
    isFeatured: r.isFeatured,
    isSoldOut: r.isSoldOut,
    badge: r.badge,
    platform: r.platform,
    postUrl: r.postUrl ?? undefined,
    isLikedByMe,
    postedAt: r.postedAt.toISOString(),
    sellerUsername: r.sellerUsername,
    sellerAvatar: r.sellerAvatar,
  };
}

function titleToSlug(title: string, id: number, existingSlugs: Set<string>): string {
  let base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  let slug = base;
  if (existingSlugs.has(slug)) {
    slug = `${base}-${id}`;
  }
  return slug;
}

router.get("/store", async (_req, res) => {
  const rows = await db.select().from(merchantsTable).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  const p = rows[0];
  res.json({
    id: p.id,
    userId: p.userId,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio,
    tagline: p.tagline,
    avatar: p.avatar,
    coverImage: p.coverImage,
    totalFollowers: p.totalFollowers,
    totalSales: p.totalSales,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isVerified: p.isVerified,
    website: p.website,
    category: p.category,
    location: p.location,
    socialLinks: p.socialLinks,
    memberSince: p.memberSince,
  });
});

router.get("/products", async (req, res) => {
  const { category, featured, platform } = req.query as { category?: string; featured?: string; platform?: string };
  let rows = await db.select().from(productsTable);
  if (category && category !== "all") rows = rows.filter((r) => r.category === category);
  if (featured === "true") rows = rows.filter((r) => r.isFeatured);
  if (platform) rows = rows.filter((r) => r.platform === platform);
  const userId = req.isAuthenticated() ? req.user.id : undefined;
  res.json(await Promise.all(rows.map((r) => formatProduct(r, userId))));
});

router.get("/products/by-slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const rows = await db.select().from(productsTable).where(eq(productsTable.slug, slug));
  const r = rows[0];
  if (!r) { res.status(404).json({ error: "Product not found" }); return; }
  const userId = req.isAuthenticated() ? req.user.id : undefined;
  res.json(await formatProduct(r, userId));
});

router.post("/products/:id/share", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product id" }); return; }
  await db.update(productsTable)
    .set({ shares: sql`${productsTable.shares} + 1` })
    .where(eq(productsTable.id, id));
  const [updated] = await db.select({ shares: productsTable.shares }).from(productsTable).where(eq(productsTable.id, id));
  res.json({ shareCount: updated?.shares ?? 0 });
});

router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product id" }); return; }
  const rows = await db.select().from(productsTable);
  const r = rows.find((p) => p.id === id);
  if (!r) { res.status(404).json({ error: "Product not found" }); return; }
  const userId = req.isAuthenticated() ? req.user.id : undefined;
  res.json(await formatProduct(r, userId));
});

router.get("/categories", async (_req, res) => {
  const rows = await db.select().from(categoriesTable);
  res.json(rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, emoji: r.emoji, productCount: r.productCount })));
});

router.get("/highlights", async (_req, res) => {
  const rows = await db.select().from(highlightsTable);
  res.json(rows.map((r) => ({ id: r.id, title: r.title, coverImage: r.coverImage, category: r.category, productCount: r.productCount })));
});

export default router;
