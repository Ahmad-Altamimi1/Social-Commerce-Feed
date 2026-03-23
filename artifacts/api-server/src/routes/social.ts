import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productLikesTable, productCommentsTable, productsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/products/:id/like", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user.id;

  const existing = await db
    .select()
    .from(productLikesTable)
    .where(and(eq(productLikesTable.userId, userId), eq(productLikesTable.productId, productId)));

  if (existing.length > 0) {
    await db.delete(productLikesTable).where(
      and(eq(productLikesTable.userId, userId), eq(productLikesTable.productId, productId))
    );
    await db.update(productsTable)
      .set({ likes: sql`GREATEST(${productsTable.likes} - 1, 0)` })
      .where(eq(productsTable.id, productId));
    const [updated] = await db.select({ likes: productsTable.likes }).from(productsTable).where(eq(productsTable.id, productId));
    res.json({ liked: false, likeCount: updated?.likes ?? 0 });
  } else {
    await db.insert(productLikesTable).values({ userId, productId });
    await db.update(productsTable)
      .set({ likes: sql`${productsTable.likes} + 1` })
      .where(eq(productsTable.id, productId));
    const [updated] = await db.select({ likes: productsTable.likes }).from(productsTable).where(eq(productsTable.id, productId));
    res.json({ liked: true, likeCount: updated?.likes ?? 0 });
  }
});

router.get("/products/:id/comments", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
    .select({
      id: productCommentsTable.id,
      userId: productCommentsTable.userId,
      text: productCommentsTable.text,
      createdAt: productCommentsTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(productCommentsTable)
    .innerJoin(usersTable, eq(productCommentsTable.userId, usersTable.id))
    .where(eq(productCommentsTable.productId, productId))
    .orderBy(productCommentsTable.createdAt);

  res.json(rows.map((r) => {
    const displayName = [r.firstName, r.lastName].filter(Boolean).join(" ") || "User";
    return {
      id: r.id,
      userId: r.userId,
      username: displayName,
      avatar: r.profileImageUrl ?? "",
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    };
  }));
});

router.post("/products/:id/comments", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { text } = req.body as { text: string };
  if (!text?.trim()) { res.status(400).json({ error: "Comment text is required" }); return; }

  const userId = req.user.id;

  const [comment] = await db.insert(productCommentsTable).values({
    userId,
    productId,
    text: text.trim(),
  }).returning();

  await db.update(productsTable)
    .set({ comments: sql`${productsTable.comments} + 1` })
    .where(eq(productsTable.id, productId));

  const [user] = await db
    .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, profileImageUrl: usersTable.profileImageUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  res.status(201).json({
    id: comment.id,
    userId: comment.userId,
    username: displayName,
    avatar: user?.profileImageUrl ?? "",
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  });
});

export default router;
