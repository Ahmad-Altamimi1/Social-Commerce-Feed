// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  db,
  usersTable,
  merchantsTable,
  productsTable,
  categoriesTable,
  highlightsTable,
  cartItemsTable,
  ordersTable,
  orderItemsTable,
  productLikesTable,
  productCommentsTable,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getOrCreateGuestUserId, resolveClerkUser } from "../../../server/auth";

const j = (data: unknown, status = 200) => NextResponse.json(data, { status });
const int = (v: string | null, d = 0) => (v ? parseInt(v, 10) : d);

const fmtMerchant = (m: any) => ({ ...m });
const fmtProduct = (p: any, isLikedByMe = false) => ({
  ...p,
  postUrl: p.postUrl ?? undefined,
  isLikedByMe,
  postedAt: p.postedAt.toISOString(),
});

async function buildCart(actorId: string, req: NextRequest) {
  const res = j({});
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, actorId));
  if (!items.length) return j({ groups: [], totalItems: 0, total: 0 });
  const products = await db.select().from(productsTable);
  const merchants = await db.select().from(merchantsTable);
  const pMap = new Map(products.map((p) => [p.id, p]));
  const mMap = new Map(merchants.map((m) => [m.id, m]));
  const byMerchant = new Map();
  for (const i of items) {
    if (!byMerchant.has(i.merchantId)) byMerchant.set(i.merchantId, []);
    byMerchant.get(i.merchantId).push(i);
  }
  const groups = [...byMerchant.entries()].map(([merchantId, merchantItems]) => {
    const enriched = merchantItems.map((i) => ({ id: i.id, productId: i.productId, merchantId: i.merchantId, quantity: i.quantity, product: fmtProduct(pMap.get(i.productId)) }));
    const subtotal = enriched.reduce((s, i) => s + i.product.price * i.quantity, 0);
    return { merchant: fmtMerchant(mMap.get(merchantId)), items: enriched, subtotal };
  });
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const total = groups.reduce((s, g) => s + g.subtotal, 0);
  return j({ groups, totalItems, total });
}

async function handle(req: NextRequest, slug: string[] = []) {
  const path = `/${slug.join("/")}`;
  const method = req.method;
  const user = await resolveClerkUser(req);
  const url = new URL(req.url);

  if (path === "/healthz" && method === "GET") return j({ status: "ok" });
  if (path === "/auth/user" && method === "GET") return j({ isAuthenticated: !!user, user: user ?? undefined });
  if ((path === "/login" || path === "/callback" || path === "/logout") && method === "GET") return j({ error: "Deprecated. Use Clerk client-side auth flow." }, 410);

  if (path === "/feed" && method === "GET") {
    const category = url.searchParams.get("category");
    const limit = Math.min(int(url.searchParams.get("limit"), 20), 100);
    const offset = int(url.searchParams.get("offset"), 0);
    let products = await db.select().from(productsTable);
    const merchants = await db.select().from(merchantsTable);
    const mMap = new Map(merchants.map((m) => [m.id, m]));
    if (category && category !== "all") products = products.filter((p) => p.category === category);
    products = products.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime()).slice(offset, offset + limit);
    let liked = new Set<number>();
    if (user && products.length) {
      const likes = await db.select({ productId: productLikesTable.productId }).from(productLikesTable).where(and(eq(productLikesTable.userId, user.id), inArray(productLikesTable.productId, products.map((p) => p.id))));
      liked = new Set(likes.map((l) => l.productId));
    }
    return j(products.map((p) => {
      const m = mMap.get(p.merchantId);
      return { ...fmtProduct(p, liked.has(p.id)), merchantUsername: m?.username ?? "", merchantDisplayName: m?.displayName ?? "", merchantAvatar: m?.avatar ?? "", merchantIsVerified: m?.isVerified ?? false };
    }));
  }

  if (path === "/merchants" && method === "GET") return j((await db.select().from(merchantsTable)).map(fmtMerchant));
  if (path.startsWith("/merchants/") && method === "GET") {
    const [, , username, section] = path.split("/");
    const rows = await db.select().from(merchantsTable).where(eq(merchantsTable.username, username));
    if (!rows[0]) return j({ error: "Merchant not found" }, 404);
    if (!section) return j(fmtMerchant(rows[0]));
    if (section === "products") {
      let products = await db.select().from(productsTable).where(eq(productsTable.merchantId, rows[0].id));
      return j(products.map((p) => fmtProduct(p)));
    }
    if (section === "highlights") {
      const highlights = await db.select().from(highlightsTable).where(eq(highlightsTable.merchantId, rows[0].id));
      return j(highlights);
    }
  }

  if (path === "/merchant/me" && method === "GET") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const rows = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, user.id));
    if (!rows[0]) return j({ error: "No merchant profile" }, 404);
    return j(fmtMerchant(rows[0]));
  }
  if (path === "/merchant/register" && method === "POST") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const [merchant] = await db.insert(merchantsTable).values({
      userId: user.id,
      username: body.username,
      displayName: body.displayName,
      tagline: body.tagline ?? "",
      bio: body.bio ?? "",
      avatar: user.profileImageUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.username}`,
      totalFollowers: 0,
      totalSales: 0,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      website: body.website ?? "",
      category: body.category ?? "",
      location: body.location ?? "",
      socialLinks: [],
      memberSince: new Date().getFullYear().toString(),
    }).returning();
    return j(fmtMerchant(merchant), 201);
  }
  if (path === "/merchant/products" && method === "GET") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const m = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, user.id));
    if (!m[0]) return j({ error: "No merchant profile" }, 403);
    return j((await db.select().from(productsTable).where(eq(productsTable.merchantId, m[0].id))).map((p) => fmtProduct(p)));
  }
  if (path === "/merchant/products" && method === "POST") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const m = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, user.id));
    if (!m[0]) return j({ error: "No merchant profile" }, 403);
    const body = await req.json();
    const { platform: _ignoredPlatform, ...productData } = body ?? {};
    const [p] = await db.insert(productsTable).values({ ...productData, platform: "store", merchantId: m[0].id, sellerUsername: m[0].username, sellerAvatar: m[0].avatar }).returning();
    return j(fmtProduct(p), 201);
  }
  if (path.startsWith("/merchant/products/")) {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const id = int(path.split("/")[3], NaN);
    if (Number.isNaN(id)) return j({ error: "Invalid id" }, 400);
    if (method === "PUT") {
      const body = await req.json();
      const { platform: _ignoredPlatform, ...productData } = body ?? {};
      const [p] = await db.update(productsTable).set(productData).where(eq(productsTable.id, id)).returning();
      return j(fmtProduct(p));
    }
    if (method === "DELETE") {
      await db.delete(productsTable).where(eq(productsTable.id, id));
      return new NextResponse(null, { status: 204 });
    }
  }
  if (path === "/merchant/orders" && method === "GET") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const merchant = await db.select().from(merchantsTable).where(eq(merchantsTable.userId, user.id));
    if (!merchant[0]) return j({ error: "No merchant profile" }, 403);
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.merchantId, merchant[0].id));
    const orderIds = [...new Set(items.map((i) => i.orderId))];
    if (!orderIds.length) return j([]);
    const orders = await db.select().from(ordersTable);
    return j(orders.filter((o) => orderIds.includes(o.id)).map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), items: items.filter((i) => i.orderId === o.id), total: items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.price * i.quantity, 0) })));
  }
  if (path.startsWith("/merchant/orders/") && path.endsWith("/status") && method === "PATCH") {
    const id = int(path.split("/")[3], NaN);
    const body = await req.json();
    const [o] = await db.update(ordersTable).set({ status: body.status }).where(eq(ordersTable.id, id)).returning();
    return j({ ...o, createdAt: o.createdAt.toISOString(), items: await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)) });
  }

  if (path === "/cart" && method === "GET") return buildCart(user?.id ?? await getOrCreateGuestUserId(req, j({})), req);
  if (path === "/cart" && method === "POST") {
    const actorId = user?.id ?? await getOrCreateGuestUserId(req, j({}));
    const body = await req.json();
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId));
    const existing = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.userId, actorId), eq(cartItemsTable.productId, body.productId)));
    if (existing[0]) await db.update(cartItemsTable).set({ quantity: existing[0].quantity + (body.quantity ?? 1) }).where(eq(cartItemsTable.id, existing[0].id));
    else await db.insert(cartItemsTable).values({ userId: actorId, productId: body.productId, merchantId: product.merchantId, quantity: body.quantity ?? 1 });
    return buildCart(actorId, req);
  }
  if (path === "/cart" && method === "DELETE") {
    const actorId = user?.id ?? await getOrCreateGuestUserId(req, j({}));
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, actorId));
    return new NextResponse(null, { status: 204 });
  }
  if (path.startsWith("/cart/")) {
    const actorId = user?.id ?? await getOrCreateGuestUserId(req, j({}));
    const itemId = int(path.split("/")[2], NaN);
    if (method === "PUT") {
      const body = await req.json();
      if (body.quantity <= 0) await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, actorId)));
      else await db.update(cartItemsTable).set({ quantity: body.quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, actorId)));
      return buildCart(actorId, req);
    }
    if (method === "DELETE") {
      await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, actorId)));
      return buildCart(actorId, req);
    }
  }

  if (path === "/orders" && method === "GET") {
    const actorId = user?.id ?? await getOrCreateGuestUserId(req, j({}));
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, actorId));
    const result = await Promise.all(orders.map(async (o) => ({ ...o, createdAt: o.createdAt.toISOString(), items: await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id)) })));
    return j(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }
  if (path === "/orders" && method === "POST") {
    const actorId = user?.id ?? await getOrCreateGuestUserId(req, j({}));
    const body = await req.json();
    const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, actorId));
    if (!cartItems.length) return j({ error: "Cart is empty" }, 400);
    const products = await db.select().from(productsTable);
    const merchants = await db.select().from(merchantsTable);
    const pMap = new Map(products.map((p) => [p.id, p]));
    const mMap = new Map(merchants.map((m) => [m.id, m]));
    const total = cartItems.reduce((s, i) => s + (pMap.get(i.productId)?.price ?? 0) * i.quantity, 0);
    const [order] = await db.insert(ordersTable).values({ userId: actorId, status: "pending", customerName: body.customerName, customerNotes: body.customerNotes, address: body.address, locationLat: body.locationLat, locationLng: body.locationLng, total }).returning();
    const items = await db.insert(orderItemsTable).values(cartItems.map((i) => ({ orderId: order.id, productId: i.productId, merchantId: i.merchantId, merchantUsername: mMap.get(i.merchantId)?.username ?? "", quantity: i.quantity, price: pMap.get(i.productId).price, title: pMap.get(i.productId).title, image: pMap.get(i.productId).images[0] ?? null }))).returning();
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, actorId));
    return j({ ...order, createdAt: order.createdAt.toISOString(), items }, 201);
  }

  if (path === "/store" && method === "GET") {
    const m = await db.select().from(merchantsTable).limit(1);
    if (!m[0]) return j({ error: "Store not found" }, 404);
    return j(fmtMerchant(m[0]));
  }
  if (path === "/products" && method === "GET") {
    let rows = await db.select().from(productsTable);
    const category = url.searchParams.get("category");
    const featured = url.searchParams.get("featured");
    if (category && category !== "all") rows = rows.filter((r) => r.category === category);
    if (featured === "true") rows = rows.filter((r) => r.isFeatured);
    return j(rows.map((r) => fmtProduct(r)));
  }
  if (path.startsWith("/products/by-slug/") && method === "GET") {
    const slugValue = path.split("/")[3];
    const [p] = await db.select().from(productsTable).where(eq(productsTable.slug, slugValue));
    if (!p) return j({ error: "Product not found" }, 404);
    return j(fmtProduct(p));
  }
  if (path.startsWith("/products/") && path.endsWith("/share") && method === "POST") {
    const id = int(path.split("/")[2], NaN);
    await db.update(productsTable).set({ shares: sql`${productsTable.shares} + 1` }).where(eq(productsTable.id, id));
    const [u] = await db.select({ shares: productsTable.shares }).from(productsTable).where(eq(productsTable.id, id));
    return j({ shareCount: u?.shares ?? 0 });
  }
  if (path.startsWith("/products/") && path.endsWith("/like") && method === "POST") {
    if (!user) return j({ error: "Unauthorized" }, 401);
    const id = int(path.split("/")[2], NaN);
    const existing = await db.select().from(productLikesTable).where(and(eq(productLikesTable.userId, user.id), eq(productLikesTable.productId, id)));
    if (existing[0]) {
      await db.delete(productLikesTable).where(and(eq(productLikesTable.userId, user.id), eq(productLikesTable.productId, id)));
      await db.update(productsTable).set({ likes: sql`GREATEST(${productsTable.likes} - 1, 0)` }).where(eq(productsTable.id, id));
      const [u] = await db.select({ likes: productsTable.likes }).from(productsTable).where(eq(productsTable.id, id));
      return j({ liked: false, likeCount: u?.likes ?? 0 });
    }
    await db.insert(productLikesTable).values({ userId: user.id, productId: id });
    await db.update(productsTable).set({ likes: sql`${productsTable.likes} + 1` }).where(eq(productsTable.id, id));
    const [u] = await db.select({ likes: productsTable.likes }).from(productsTable).where(eq(productsTable.id, id));
    return j({ liked: true, likeCount: u?.likes ?? 0 });
  }
  if (path.startsWith("/products/") && path.endsWith("/comments")) {
    const id = int(path.split("/")[2], NaN);
    if (method === "GET") {
      const rows = await db.select({ id: productCommentsTable.id, userId: productCommentsTable.userId, text: productCommentsTable.text, createdAt: productCommentsTable.createdAt, firstName: usersTable.firstName, lastName: usersTable.lastName, profileImageUrl: usersTable.profileImageUrl }).from(productCommentsTable).innerJoin(usersTable, eq(productCommentsTable.userId, usersTable.id)).where(eq(productCommentsTable.productId, id)).orderBy(productCommentsTable.createdAt);
      return j(rows.map((r) => ({ id: r.id, userId: r.userId, username: [r.firstName, r.lastName].filter(Boolean).join(" ") || "User", avatar: r.profileImageUrl ?? "", text: r.text, createdAt: r.createdAt.toISOString() })));
    }
    if (method === "POST") {
      if (!user) return j({ error: "Unauthorized" }, 401);
      const body = await req.json();
      const [c] = await db.insert(productCommentsTable).values({ userId: user.id, productId: id, text: body.text?.trim() }).returning();
      await db.update(productsTable).set({ comments: sql`${productsTable.comments} + 1` }).where(eq(productsTable.id, id));
      const [u] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, profileImageUrl: usersTable.profileImageUrl }).from(usersTable).where(eq(usersTable.id, user.id));
      return j({ id: c.id, userId: c.userId, username: [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "User", avatar: u?.profileImageUrl ?? "", text: c.text, createdAt: c.createdAt.toISOString() }, 201);
    }
  }
  if (path.startsWith("/products/") && method === "GET") {
    const id = int(path.split("/")[2], NaN);
    const [p] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!p) return j({ error: "Product not found" }, 404);
    return j(fmtProduct(p));
  }

  if (path === "/categories" && method === "GET") return j(await db.select().from(categoriesTable));
  if (path === "/highlights" && method === "GET") return j(await db.select().from(highlightsTable));

  if (path === "/oembed" && method === "GET") {
    const sourceUrl = url.searchParams.get("url");
    if (!sourceUrl) return j({ error: "url query param is required" }, 400);
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:") return j({ error: "Only HTTPS URLs are supported" }, 400);
      const isInsta = ["instagram.com", "www.instagram.com"].includes(parsed.hostname);
      const isTikTok = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"].includes(parsed.hostname);
      if (!isInsta && !isTikTok) return j({ error: "Unsupported URL. Only supported oEmbed providers are allowed." }, 400);
      const upstreamUrl = isInsta ? `https://api.instagram.com/oembed/?url=${encodeURIComponent(sourceUrl)}&omitscript=false` : `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`;
      const upstream = await fetch(upstreamUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialShopBot/1.0)" } });
      if (!upstream.ok) return j({ error: `Upstream oEmbed request failed with status ${upstream.status}` }, 502);
      const data = await upstream.json();
      return j({ html: data.html ?? null, title: data.title ?? null, thumbnail_url: data.thumbnail_url ?? null });
    } catch {
      return j({ error: "Invalid URL" }, 400);
    }
  }

  return j({ error: "Not found" }, 404);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  return handle(req, (await ctx.params).slug ?? []);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  return handle(req, (await ctx.params).slug ?? []);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  return handle(req, (await ctx.params).slug ?? []);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  return handle(req, (await ctx.params).slug ?? []);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  return handle(req, (await ctx.params).slug ?? []);
}
