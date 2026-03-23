import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export type SocialLink = {
  platform: string;
  url: string;
  handle: string;
  followerCount?: number;
};

export const merchantsTable = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline"),
  bio: text("bio").notNull().default(""),
  avatar: text("avatar").notNull(),
  coverImage: text("cover_image"),
  totalFollowers: integer("total_followers").notNull().default(0),
  totalSales: integer("total_sales").notNull().default(0),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  website: text("website"),
  category: text("category"),
  location: text("location"),
  socialLinks: jsonb("social_links").$type<SocialLink[]>().notNull().default([]),
  memberSince: text("member_since"),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  emoji: text("emoji").notNull(),
  productCount: integer("product_count").notNull().default(0),
});

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  currency: text("currency").notNull().default("USD"),
  images: text("images").array().notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull(),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isSoldOut: boolean("is_sold_out").notNull().default(false),
  badge: text("badge"),
  platform: text("platform").notNull().default("instagram"),
  postUrl: text("post_url"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  sellerUsername: text("seller_username").notNull(),
  sellerAvatar: text("seller_avatar").notNull(),
});

export const highlightsTable = pgTable("highlights", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  title: text("title").notNull(),
  coverImage: text("cover_image").notNull(),
  category: text("category").notNull(),
  productCount: integer("product_count").notNull().default(0),
});

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  customerNotes: text("customer_notes"),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  address: text("address").notNull(),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  title: text("title").notNull(),
  image: text("image"),
  merchantUsername: text("merchant_username").notNull(),
});

export const productLikesTable = pgTable("product_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productCommentsTable = pgTable("product_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Keep the old table for backwards compat (unused but referenced)
export const storeProfilesTable = merchantsTable;

export const insertMerchantSchema = createInsertSchema(merchantsTable).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true });
export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export const insertHighlightSchema = createInsertSchema(highlightsTable).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({ id: true, addedAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });

export type Merchant = typeof merchantsTable.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Highlight = typeof highlightsTable.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type CartItem = typeof cartItemsTable.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
