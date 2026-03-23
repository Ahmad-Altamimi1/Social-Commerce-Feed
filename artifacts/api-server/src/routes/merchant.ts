import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { merchantsTable, productsTable, highlightsTable, usersTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function formatMerchant(m: typeof merchantsTable.$inferSelect) {
  return {
    id: m.id,
    userId: m.userId,
    username: m.username,
    displayName: m.displayName,
    bio: m.bio,
    tagline: m.tagline,
    avatar: m.avatar,
    coverImage: m.coverImage,
    totalFollowers: m.totalFollowers,
    totalSales: m.totalSales,
    rating: m.rating,
    reviewCount: m.reviewCount,
    isVerified: m.isVerified,
    website: m.website,
    category: m.category,
    location: m.location,
    socialLinks: m.socialLinks,
    memberSince: m.memberSince,
  };
}

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    merchantId: p.merchantId,
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
}

router.get("/merchants", async (_req, res) => {
  const rows = await db.select().from(merchantsTable);
  res.json(rows.map(formatMerchant));
});

router.get("/merchants/:username", async (req, res) => {
  const rows = await db.select().from(merchantsTable).where(eq(merchantsTable.username, req.params.username));
  if (!rows[0]) { res.status(404).json({ error: "Merchant not found" }); return; }
  res.json(formatMerchant(rows[0]));
});

router.get("/merchants/:username/products", async (req, res) => {
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.username, req.params.username));
  if (!merchant[0]) { res.status(404).json({ error: "Merchant not found" }); return; }
  const { platform } = req.query as { platform?: string };
  let products = await db.select().from(productsTable).where(eq(productsTable.merchantId, merchant[0].id));
  if (platform) products = products.filter((p) => p.platform === platform);
  res.json(products.map(formatProduct));
});

router.get("/merchants/:username/highlights", async (req, res) => {
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.username, req.params.username));
  if (!merchant[0]) { res.status(404).json({ error: "Merchant not found" }); return; }
  const rows = await db.select().from(highlightsTable).where(eq(highlightsTable.merchantId, merchant[0].id));
  res.json(rows.map((h) => ({ id: h.id, title: h.title, coverImage: h.coverImage, category: h.category, productCount: h.productCount })));
});

router.get("/merchant/me", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!rows[0]) { res.status(404).json({ error: "No merchant profile" }); return; }
  res.json(formatMerchant(rows[0]));
});

router.post("/merchant/register", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { username, displayName, tagline, bio, category, location, website } = req.body as {
    username: string; displayName: string; tagline?: string; bio: string; category?: string; location?: string; website?: string;
  };
  if (!username || !displayName) { res.status(400).json({ error: "username and displayName are required" }); return; }

  const existing = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (existing[0]) { res.status(400).json({ error: "Already have a merchant profile" }); return; }

  const usernameExists = await db.select().from(merchantsTable).where(eq(merchantsTable.username, username));
  if (usernameExists[0]) { res.status(400).json({ error: "Username already taken" }); return; }

  const user = req.user;
  const avatar = user.profileImageUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  const [merchant] = await db.insert(merchantsTable).values({
    userId: req.user.id,
    username,
    displayName,
    tagline: tagline ?? "",
    bio: bio ?? "",
    avatar,
    totalFollowers: 0,
    totalSales: 0,
    rating: 0,
    reviewCount: 0,
    isVerified: false,
    website: website ?? "",
    category: category ?? "",
    location: location ?? "",
    socialLinks: [],
    memberSince: new Date().getFullYear().toString(),
  }).returning();

  res.status(201).json(formatMerchant(merchant));
});

router.get("/merchant/products", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(404).json({ error: "No merchant profile" }); return; }
  const products = await db.select().from(productsTable).where(eq(productsTable.merchantId, merchant[0].id));
  res.json(products.map(formatProduct));
});

router.post("/merchant/products", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(403).json({ error: "No merchant profile" }); return; }
  const m = merchant[0];
  const body = req.body as {
    title: string; description: string; price: number; originalPrice?: number; currency?: string;
    images: string[]; category: string; tags: string[]; isFeatured?: boolean; badge?: string; platform: string; postUrl?: string;
  };
  const [product] = await db.insert(productsTable).values({
    merchantId: m.id,
    title: body.title,
    description: body.description,
    price: body.price,
    originalPrice: body.originalPrice,
    currency: body.currency ?? "USD",
    images: body.images,
    category: body.category,
    tags: body.tags ?? [],
    isFeatured: body.isFeatured ?? false,
    badge: body.badge,
    platform: body.platform,
    postUrl: body.postUrl,
    sellerUsername: m.username,
    sellerAvatar: m.avatar,
  }).returning();
  res.status(201).json(formatProduct(product));
});

router.put("/merchant/products/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(403).json({ error: "No merchant profile" }); return; }
  const id = parseInt(req.params.id, 10);
  const existing = await db.select().from(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.merchantId, merchant[0].id)));
  if (!existing[0]) { res.status(404).json({ error: "Product not found" }); return; }
  const body = req.body;
  const [updated] = await db.update(productsTable).set(body).where(eq(productsTable.id, id)).returning();
  res.json(formatProduct(updated));
});

router.delete("/merchant/products/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(403).json({ error: "No merchant profile" }); return; }
  const id = parseInt(req.params.id, 10);
  await db.delete(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.merchantId, merchant[0].id)));
  res.status(204).send();
});

router.get("/merchant/orders", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(403).json({ error: "No merchant profile" }); return; }

  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.merchantId, merchant[0].id));
  const orderIds = [...new Set(orderItems.map((i) => i.orderId))];

  if (orderIds.length === 0) { res.json([]); return; }

  const orders = await db.select().from(ordersTable);
  const relevantOrders = orders.filter((o) => orderIds.includes(o.id));

  res.json(
    relevantOrders.map((o) => {
      const items = orderItems.filter((i) => i.orderId === o.id);
      return {
        id: o.id,
        status: o.status,
        customerName: o.customerName,
        customerNotes: o.customerNotes,
        address: o.address,
        locationLat: o.locationLat,
        locationLng: o.locationLng,
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        createdAt: o.createdAt.toISOString(),
        items: items.map((i) => ({
          id: i.id, productId: i.productId, merchantId: i.merchantId, merchantUsername: i.merchantUsername,
          quantity: i.quantity, price: i.price, title: i.title, image: i.image,
        })),
      };
    })
  );
});

router.patch("/merchant/orders/:id/status", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, req.user.id));
  if (!merchant[0]) { res.status(403).json({ error: "No merchant profile" }); return; }
  const { status } = req.body as { status: string };
  const id = parseInt(req.params.id, 10);
  const [updated] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Order not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(and(eq(orderItemsTable.orderId, id), eq(orderItemsTable.merchantId, merchant[0].id)));
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), items });
});

export default router;
