import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, productsTable, merchantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getOrCreateGuestUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/orders", async (req, res) => {
  const actorId = req.isAuthenticated()
    ? req.user.id
    : await getOrCreateGuestUserId(req, res);
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, actorId));
  const result = await Promise.all(
    orders.map(async (o) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
      return {
        id: o.id, status: o.status, customerName: o.customerName, customerNotes: o.customerNotes,
        address: o.address, locationLat: o.locationLat, locationLng: o.locationLng,
        total: o.total, createdAt: o.createdAt.toISOString(),
        items: items.map((i) => ({
          id: i.id, productId: i.productId, merchantId: i.merchantId, merchantUsername: i.merchantUsername,
          quantity: i.quantity, price: i.price, title: i.title, image: i.image,
        })),
      };
    })
  );
  res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.post("/orders", async (req, res) => {
  const actorId = req.isAuthenticated()
    ? req.user.id
    : await getOrCreateGuestUserId(req, res);
  const { customerName, customerNotes, address, locationLat, locationLng } = req.body as {
    customerName: string; customerNotes?: string; address: string; locationLat?: number; locationLng?: number;
  };
  if (!customerName || !address) { res.status(400).json({ error: "customerName and address are required" }); return; }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, actorId));
  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const productIds = cartItems.map((i) => i.productId);
  const products = await db.select().from(productsTable);
  const merchants = await db.select().from(merchantsTable);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  const total = cartItems.reduce((sum, i) => {
    const p = productMap.get(i.productId);
    return sum + (p?.price ?? 0) * i.quantity;
  }, 0);

  const [order] = await db.insert(ordersTable).values({
    userId: actorId,
    status: "pending",
    customerName,
    customerNotes,
    address,
    locationLat,
    locationLng,
    total,
  }).returning();

  const orderItemValues = cartItems.map((i) => {
    const p = productMap.get(i.productId)!;
    const m = merchantMap.get(i.merchantId)!;
    return {
      orderId: order.id,
      productId: i.productId,
      merchantId: i.merchantId,
      merchantUsername: m?.username ?? "",
      quantity: i.quantity,
      price: p.price,
      title: p.title,
      image: p.images[0] ?? null,
    };
  });

  const insertedItems = await db.insert(orderItemsTable).values(orderItemValues).returning();

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, actorId));

  res.status(201).json({
    id: order.id, status: order.status, customerName: order.customerName, customerNotes: order.customerNotes,
    address: order.address, locationLat: order.locationLat, locationLng: order.locationLng,
    total: order.total, createdAt: order.createdAt.toISOString(),
    items: insertedItems.map((i) => ({
      id: i.id, productId: i.productId, merchantId: i.merchantId, merchantUsername: i.merchantUsername,
      quantity: i.quantity, price: i.price, title: i.title, image: i.image,
    })),
  });
});

export default router;
