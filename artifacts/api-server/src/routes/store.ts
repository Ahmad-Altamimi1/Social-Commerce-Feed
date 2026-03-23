import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { merchantsTable, productsTable, categoriesTable, highlightsTable } from "@workspace/db";

const router: IRouter = Router();

function formatProduct(r: typeof productsTable.$inferSelect) {
  return {
    id: r.id,
    merchantId: r.merchantId,
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
    postedAt: r.postedAt.toISOString(),
    sellerUsername: r.sellerUsername,
    sellerAvatar: r.sellerAvatar,
  };
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
  res.json(rows.map(formatProduct));
});

router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product id" }); return; }
  const rows = await db.select().from(productsTable);
  const r = rows.find((p) => p.id === id);
  if (!r) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(r));
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
