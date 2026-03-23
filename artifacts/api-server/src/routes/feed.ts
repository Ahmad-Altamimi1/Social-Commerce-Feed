import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { merchantsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/feed", async (req, res) => {
  const { platform, category, limit: limitQ, offset: offsetQ } = req.query as {
    platform?: string;
    category?: string;
    limit?: string;
    offset?: string;
  };

  const limit = Math.min(parseInt(limitQ ?? "20", 10), 100);
  const offset = parseInt(offsetQ ?? "0", 10);

  const products = await db.select().from(productsTable);
  const merchants = await db.select().from(merchantsTable);

  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  let filtered = products;
  if (platform) filtered = filtered.filter((p) => p.platform === platform);
  if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);

  filtered = filtered.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

  const paginated = filtered.slice(offset, offset + limit);

  res.json(
    paginated.map((p) => {
      const m = merchantMap.get(p.merchantId);
      return {
        id: p.id,
        merchantId: p.merchantId,
        merchantUsername: m?.username ?? "",
        merchantDisplayName: m?.displayName ?? "",
        merchantAvatar: m?.avatar ?? "",
        merchantIsVerified: m?.isVerified ?? false,
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        currency: p.currency,
        images: p.images,
        category: p.category,
        tags: p.tags,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        isFeatured: p.isFeatured,
        isSoldOut: p.isSoldOut,
        badge: p.badge,
        platform: p.platform,
        postUrl: p.postUrl ?? undefined,
        postedAt: p.postedAt.toISOString(),
        sellerUsername: p.sellerUsername,
        sellerAvatar: p.sellerAvatar,
      };
    })
  );
});

export default router;
