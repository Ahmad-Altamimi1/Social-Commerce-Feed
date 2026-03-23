import { db } from "@workspace/db";
import {
  merchantsTable, productsTable, categoriesTable, highlightsTable, usersTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding multi-merchant store...");

  await db.delete(highlightsTable);
  await db.delete(productsTable);
  await db.delete(merchantsTable);
  await db.delete(categoriesTable);
  await db.delete(usersTable);

  const [u1] = await db.insert(usersTable).values({ id: "user-luxe-001", firstName: "Sophia", lastName: "Chen", email: "sophia@luxe.shop", profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" }).returning();
  const [u2] = await db.insert(usersTable).values({ id: "user-nomad-002", firstName: "Marcus", lastName: "Rivera", email: "marcus@nomad.shop", profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" }).returning();
  const [u3] = await db.insert(usersTable).values({ id: "user-verde-003", firstName: "Aisha", lastName: "Khan", email: "aisha@verde.shop", profileImageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200" }).returning();

  const [m1] = await db.insert(merchantsTable).values({
    userId: u1.id,
    username: "luxe.boutique",
    displayName: "Luxe Boutique",
    tagline: "Curated fashion for the modern you",
    bio: "We bring you the best in contemporary fashion & lifestyle. Every piece is hand-picked with love. 🛍️ Worldwide shipping · Easy returns · DM to order",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    coverImage: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900",
    totalFollowers: 124600,
    totalSales: 8340,
    rating: 4.8,
    reviewCount: 1247,
    isVerified: true,
    website: "luxeboutique.shop",
    category: "Fashion",
    location: "New York, NY",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/luxe.boutique", handle: "@luxe.boutique", followerCount: 82400 },
      { platform: "facebook", url: "https://facebook.com/luxeboutique", handle: "Luxe Boutique", followerCount: 34200 },
      { platform: "tiktok", url: "https://tiktok.com/@luxeboutique", handle: "@luxeboutique", followerCount: 8000 },
    ],
    memberSince: "2022",
  }).returning();

  const [m2] = await db.insert(merchantsTable).values({
    userId: u2.id,
    username: "nomad.gear",
    displayName: "Nomad Gear Co.",
    tagline: "Gear up for every adventure",
    bio: "Premium outdoor & travel gear curated by adventurers, for adventurers. 🏔️ Free shipping on orders $75+",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900",
    totalFollowers: 89200,
    totalSales: 5120,
    rating: 4.9,
    reviewCount: 876,
    isVerified: true,
    website: "nomadgear.co",
    category: "Outdoors",
    location: "Denver, CO",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/nomadgear", handle: "@nomadgear", followerCount: 54000 },
      { platform: "tiktok", url: "https://tiktok.com/@nomadgear", handle: "@nomadgear", followerCount: 35200 },
    ],
    memberSince: "2021",
  }).returning();

  const [m3] = await db.insert(merchantsTable).values({
    userId: u3.id,
    username: "verde.living",
    displayName: "Verde Living",
    tagline: "Sustainable home & beauty essentials",
    bio: "Eco-conscious products for a greener life. 🌿 100% sustainable sourcing · Zero-waste packaging · B-Corp certified",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    coverImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900",
    totalFollowers: 67400,
    totalSales: 3890,
    rating: 4.7,
    reviewCount: 623,
    isVerified: false,
    website: "verdeliving.co",
    category: "Home & Beauty",
    location: "Portland, OR",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/verdeliving", handle: "@verdeliving", followerCount: 42100 },
      { platform: "facebook", url: "https://facebook.com/verdeliving", handle: "Verde Living", followerCount: 25300 },
    ],
    memberSince: "2023",
  }).returning();

  await db.insert(categoriesTable).values([
    { name: "Clothing", slug: "clothing", emoji: "👗", productCount: 0 },
    { name: "Accessories", slug: "accessories", emoji: "👜", productCount: 0 },
    { name: "Home", slug: "home", emoji: "🏠", productCount: 0 },
    { name: "Beauty", slug: "beauty", emoji: "✨", productCount: 0 },
    { name: "Outdoors", slug: "outdoors", emoji: "🏕️", productCount: 0 },
  ]);

  await db.insert(productsTable).values([
    // Luxe Boutique — Fashion
    { merchantId: m1.id, title: "Linen Wrap Dress", description: "Effortless summer dress in breathable Belgian linen. Available in ivory, sand, and sage.", price: 89, originalPrice: 120, currency: "USD", images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600"], category: "clothing", tags: ["linen", "dress", "summer"], likes: 3241, comments: 87, shares: 143, isFeatured: true, badge: "Bestseller", platform: "instagram", sellerUsername: "luxe.boutique", sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    { merchantId: m1.id, title: "Structured Tote Bag", description: "Minimalist leather tote with laptop sleeve. Perfect for work or weekend.", price: 145, originalPrice: 180, currency: "USD", images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"], category: "accessories", tags: ["bag", "leather", "minimalist"], likes: 2108, comments: 54, shares: 89, isFeatured: true, badge: "New", platform: "instagram", sellerUsername: "luxe.boutique", sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    { merchantId: m1.id, title: "Silk Slip Skirt", description: "Luxe midi silk skirt with adjustable waist tie. An instant wardrobe classic.", price: 72, currency: "USD", images: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600"], category: "clothing", tags: ["silk", "skirt", "elegant"], likes: 1893, comments: 42, shares: 67, isFeatured: false, platform: "facebook", sellerUsername: "luxe.boutique", sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    { merchantId: m1.id, title: "Gold Hoop Earrings Set", description: "Set of 3 graduated 18k gold-plated hoops. Lightweight and tarnish-resistant.", price: 38, currency: "USD", images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"], category: "accessories", tags: ["jewelry", "gold", "earrings"], likes: 4561, comments: 112, shares: 201, isFeatured: true, badge: "🔥 Hot", platform: "tiktok", sellerUsername: "luxe.boutique", sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    { merchantId: m1.id, title: "Oversized Blazer", description: "Power-shoulder blazer in stretch crepe. Office to cocktail effortlessly.", price: 165, originalPrice: 210, currency: "USD", images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"], category: "clothing", tags: ["blazer", "workwear", "powersuit"], likes: 2987, comments: 78, shares: 134, isFeatured: false, platform: "instagram", sellerUsername: "luxe.boutique", sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    // Nomad Gear Co. — Outdoors
    { merchantId: m2.id, title: "Ultralight Daypack 24L", description: "Packable trail backpack with hydration sleeve. Only 280g. Ripstop nylon shell.", price: 129, currency: "USD", images: ["https://images.unsplash.com/photo-1622260614153-03223fb72052?w=600"], category: "outdoors", tags: ["backpack", "hiking", "ultralight"], likes: 5102, comments: 134, shares: 289, isFeatured: true, badge: "Editor's Pick", platform: "instagram", sellerUsername: "nomad.gear", sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    { merchantId: m2.id, title: "Merino Base Layer Set", description: "Thermoregulating merino wool top & bottom. Odor-resistant for multi-day trips.", price: 185, originalPrice: 220, currency: "USD", images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600"], category: "clothing", tags: ["merino", "baselayer", "camping"], likes: 2341, comments: 67, shares: 98, isFeatured: true, badge: "Sale", platform: "tiktok", sellerUsername: "nomad.gear", sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    { merchantId: m2.id, title: "Trek Titanium Mug", description: "500ml double-wall titanium mug with leakproof lid. Keeps drinks hot for 6 hours.", price: 54, currency: "USD", images: ["https://images.unsplash.com/photo-1606402855977-a5bdf49073d8?w=600"], category: "outdoors", tags: ["mug", "titanium", "camping"], likes: 1876, comments: 43, shares: 56, isFeatured: false, platform: "instagram", sellerUsername: "nomad.gear", sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    { merchantId: m2.id, title: "Headlamp Pro 500", description: "500-lumen rechargeable headlamp. 4 modes, IPX8 waterproof. 12-hour battery life.", price: 79, originalPrice: 95, currency: "USD", images: ["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600"], category: "outdoors", tags: ["headlamp", "camping", "safety"], likes: 3421, comments: 89, shares: 167, isFeatured: true, badge: "New", platform: "facebook", sellerUsername: "nomad.gear", sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    // Verde Living — Home & Beauty
    { merchantId: m3.id, title: "Botanical Candle Set", description: "Hand-poured soy wax candles with essential oil blends. 3 scents: cedar, lavender, citrus.", price: 48, currency: "USD", images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600"], category: "home", tags: ["candle", "soy", "eco"], likes: 4231, comments: 98, shares: 176, isFeatured: true, badge: "Bestseller", platform: "instagram", sellerUsername: "verde.living", sellerAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200" },
    { merchantId: m3.id, title: "Bamboo Skincare Ritual Kit", description: "6-piece zero-waste skincare set with refillable packaging. Vegan & cruelty-free.", price: 96, originalPrice: 115, currency: "USD", images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"], category: "beauty", tags: ["skincare", "bamboo", "vegan"], likes: 3087, comments: 74, shares: 142, isFeatured: true, badge: "🌿 Eco Pick", platform: "facebook", sellerUsername: "verde.living", sellerAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200" },
    { merchantId: m3.id, title: "Organic Linen Throw", description: "OEKO-TEX certified linen throw in earthy tones. Washable and gets softer with age.", price: 112, currency: "USD", images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"], category: "home", tags: ["linen", "throw", "organic"], likes: 2190, comments: 51, shares: 83, isFeatured: false, platform: "instagram", sellerUsername: "verde.living", sellerAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200" },
  ]);

  await db.insert(highlightsTable).values([
    { merchantId: m1.id, title: "Summer Edit", coverImage: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300", category: "clothing", productCount: 8 },
    { merchantId: m1.id, title: "Accessories", coverImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300", category: "accessories", productCount: 12 },
    { merchantId: m1.id, title: "Work Wear", coverImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300", category: "clothing", productCount: 6 },
    { merchantId: m2.id, title: "Trail Ready", coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300", category: "outdoors", productCount: 10 },
    { merchantId: m2.id, title: "Camp Kitchen", coverImage: "https://images.unsplash.com/photo-1606402855977-a5bdf49073d8?w=300", category: "outdoors", productCount: 5 },
    { merchantId: m3.id, title: "Eco Picks", coverImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300", category: "home", productCount: 9 },
    { merchantId: m3.id, title: "Skincare", coverImage: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300", category: "beauty", productCount: 7 },
  ]);

  console.log("✅ Seeded 3 merchants, 12 products, 7 highlights, 5 categories");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
