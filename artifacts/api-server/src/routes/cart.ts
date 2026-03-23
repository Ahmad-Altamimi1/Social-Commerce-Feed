import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, merchantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function buildCart(userId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (items.length === 0) return { groups: [], totalItems: 0, total: 0 };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const merchantIds = [...new Set(items.map((i) => i.merchantId))];

  const products = await db.select().from(productsTable);
  const merchants = await db.select().from(merchantsTable);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  const groupMap = new Map<number, { merchant: typeof merchantsTable.$inferSelect; items: typeof cartItemsTable.$inferSelect[] }>();
  for (const item of items) {
    if (!groupMap.has(item.merchantId)) {
      groupMap.set(item.merchantId, { merchant: merchantMap.get(item.merchantId)!, items: [] });
    }
    groupMap.get(item.merchantId)!.items.push(item);
  }

  const groups = [...groupMap.values()].map(({ merchant: m, items: groupItems }) => {
    const enrichedItems = groupItems.map((i) => {
      const p = productMap.get(i.productId)!;
      return {
        id: i.id,
        productId: i.productId,
        merchantId: i.merchantId,
        quantity: i.quantity,
        product: {
          id: p.id, merchantId: p.merchantId, title: p.title, description: p.description, price: p.price,
          originalPrice: p.originalPrice, currency: p.currency, images: p.images, category: p.category,
          tags: p.tags, likes: p.likes, comments: p.comments, shares: p.shares, isFeatured: p.isFeatured,
          isSoldOut: p.isSoldOut, badge: p.badge, platform: p.platform, postedAt: p.postedAt.toISOString(),
          sellerUsername: p.sellerUsername, sellerAvatar: p.sellerAvatar,
        },
      };
    });
    const subtotal = enrichedItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    return {
      merchant: {
        id: m.id, userId: m.userId, username: m.username, displayName: m.displayName, bio: m.bio,
        tagline: m.tagline, avatar: m.avatar, coverImage: m.coverImage, totalFollowers: m.totalFollowers,
        totalSales: m.totalSales, rating: m.rating, reviewCount: m.reviewCount, isVerified: m.isVerified,
        website: m.website, category: m.category, location: m.location, socialLinks: m.socialLinks, memberSince: m.memberSince,
      },
      items: enrichedItems,
      subtotal,
    };
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const total = groups.reduce((s, g) => s + g.subtotal, 0);
  return { groups, totalItems, total };
}

router.get("/cart", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(await buildCart(req.user.id));
});

router.post("/cart", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { productId, quantity = 1 } = req.body as { productId: number; quantity?: number };
  const products = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!products[0]) { res.status(404).json({ error: "Product not found" }); return; }
  const product = products[0];

  const existing = await db.select().from(cartItemsTable).where(
    and(eq(cartItemsTable.userId, req.user.id), eq(cartItemsTable.productId, productId))
  );
  if (existing[0]) {
    await db.update(cartItemsTable).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({ userId: req.user.id, productId, merchantId: product.merchantId, quantity });
  }
  res.json(await buildCart(req.user.id));
});

router.put("/cart/:itemId", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const itemId = parseInt(req.params.itemId, 10);
  const { quantity } = req.body as { quantity: number };
  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.user.id)));
  } else {
    await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.user.id)));
  }
  res.json(await buildCart(req.user.id));
});

router.delete("/cart/:itemId", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const itemId = parseInt(req.params.itemId, 10);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.user.id)));
  res.json(await buildCart(req.user.id));
});

router.delete("/cart", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user.id));
  res.status(204).send();
});

export default router;
