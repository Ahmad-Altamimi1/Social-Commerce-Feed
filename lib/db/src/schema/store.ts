import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeProfilesTable = pgTable("store_profiles", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull().default(""),
  avatar: text("avatar").notNull(),
  coverImage: text("cover_image"),
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  website: text("website"),
  category: text("category"),
  location: text("location"),
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
  isFeatured: boolean("is_featured").notNull().default(false),
  isSoldOut: boolean("is_sold_out").notNull().default(false),
  badge: text("badge"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  sellerUsername: text("seller_username").notNull(),
  sellerAvatar: text("seller_avatar").notNull(),
});

export const highlightsTable = pgTable("highlights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  coverImage: text("cover_image").notNull(),
  category: text("category").notNull(),
});

export const insertStoreProfileSchema = createInsertSchema(storeProfilesTable).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true });
export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export const insertHighlightSchema = createInsertSchema(highlightsTable).omit({ id: true });

export type StoreProfile = typeof storeProfilesTable.$inferSelect;
export type InsertStoreProfile = z.infer<typeof insertStoreProfileSchema>;
export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Highlight = typeof highlightsTable.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
