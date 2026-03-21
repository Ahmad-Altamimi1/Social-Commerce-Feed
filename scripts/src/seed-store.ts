import { db } from "@workspace/db";
import {
  storeProfilesTable,
  categoriesTable,
  productsTable,
  highlightsTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding store data...");

  await db.delete(highlightsTable);
  await db.delete(productsTable);
  await db.delete(categoriesTable);
  await db.delete(storeProfilesTable);

  await db.insert(storeProfilesTable).values({
    username: "luxe.boutique",
    displayName: "Luxe Boutique",
    tagline: "Curated fashion for the modern you",
    bio: "We bring you the best in contemporary fashion & lifestyle. Every piece is hand-picked with love. 🛍️ Worldwide shipping · Easy returns · DM to order",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=500&fit=crop",
    totalFollowers: 124600,
    totalSales: 8340,
    rating: 4.8,
    reviewCount: 2140,
    isVerified: true,
    website: "luxeboutique.shop",
    category: "Fashion & Lifestyle",
    location: "New York, NY",
    memberSince: "2021",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/luxe.boutique", handle: "@luxe.boutique", followerCount: 82400 },
      { platform: "facebook", url: "https://facebook.com/luxeboutique", handle: "Luxe Boutique", followerCount: 34200 },
      { platform: "tiktok", url: "https://tiktok.com/@luxeboutique", handle: "@luxeboutique", followerCount: 8000 },
    ],
  });

  await db.insert(categoriesTable).values([
    { name: "All", slug: "all", emoji: "✨", productCount: 12 },
    { name: "Clothing", slug: "clothing", emoji: "👗", productCount: 5 },
    { name: "Accessories", slug: "accessories", emoji: "💍", productCount: 4 },
    { name: "Shoes", slug: "shoes", emoji: "👠", productCount: 2 },
    { name: "Bags", slug: "bags", emoji: "👜", productCount: 1 },
  ]);

  await db.insert(highlightsTable).values([
    { title: "New In", coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop", category: "new", productCount: 4 },
    { title: "On Sale", coverImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop", category: "sale", productCount: 3 },
    { title: "Summer", coverImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop", category: "summer", productCount: 5 },
    { title: "Bags", coverImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop", category: "bags", productCount: 2 },
    { title: "Shoes", coverImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=200&fit=crop", category: "shoes", productCount: 3 },
    { title: "Inspo", coverImage: "https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=200&h=200&fit=crop", category: "inspo", productCount: 6 },
  ]);

  const sellerAvatar = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face";
  const sellerUsername = "luxe.boutique";

  await db.insert(productsTable).values([
    {
      title: "Linen Blazer Set",
      description: "Effortlessly chic linen co-ord. Perfect for brunch or a day out. Available in beige, white & sage green. Tag us in your look! 🌿",
      price: 89, originalPrice: 120, currency: "USD",
      images: ["https://images.unsplash.com/photo-1594938298603-c8148c4b5e48?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=700&fit=crop"],
      category: "clothing", tags: ["linen", "blazer", "set", "summerstyle", "ootd"],
      likes: 2847, comments: 134, shares: 89, isFeatured: true, isSoldOut: false, badge: "SALE",
      platform: "instagram", postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Mini Pearl Bag",
      description: "The it-bag of the season 🤍 Genuine leather with pearl detailing. Limited stock — DM to order now!",
      price: 145, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=700&fit=crop"],
      category: "bags", tags: ["pearlbag", "handbag", "luxury", "aestheticbag", "fashion"],
      likes: 5631, comments: 287, shares: 201, isFeatured: true, isSoldOut: false, badge: "HOT",
      platform: "facebook", postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Gold Hoop Earrings",
      description: "Classic gold hoops that go with everything. Hypoallergenic & lightweight. Your new everyday staple 💛",
      price: 32, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1573408301185-9519f94815aa?w=600&h=700&fit=crop"],
      category: "accessories", tags: ["goldhoops", "earrings", "jewelry", "accessories", "everyday"],
      likes: 3120, comments: 89, shares: 55, isFeatured: false, isSoldOut: false, badge: null,
      platform: "instagram", postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Strappy Heeled Sandal",
      description: "Walk into summer with these 🔥 Available in nude, black & tan. Perfect for beach to dinner. Sizes 5–11.",
      price: 68, originalPrice: 95, currency: "USD",
      images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&h=700&fit=crop"],
      category: "shoes", tags: ["sandals", "heels", "summershoes", "ootd", "fashion"],
      likes: 4219, comments: 201, shares: 134, isFeatured: true, isSoldOut: false, badge: "SALE",
      platform: "facebook", postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Floral Midi Dress",
      description: "In full bloom 🌸 This breezy floral midi is everything. Features a smocked bodice and flowy skirt. Selling fast!",
      price: 72, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=700&fit=crop"],
      category: "clothing", tags: ["floraldress", "midi", "springfashion", "dress", "summerstyle"],
      likes: 6880, comments: 342, shares: 278, isFeatured: true, isSoldOut: false, badge: "NEW",
      platform: "instagram", postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Layered Chain Necklace",
      description: "Stack it up or wear solo 💫 18K gold plated layered chains. Perfect gift for yourself or someone special.",
      price: 48, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=700&fit=crop"],
      category: "accessories", tags: ["necklace", "goldchain", "jewelry", "layered", "giftsforher"],
      likes: 2340, comments: 67, shares: 44, isFeatured: false, isSoldOut: false, badge: null,
      platform: "tiktok", postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Oversized Denim Jacket",
      description: "The ultimate layering piece. Vintage-inspired distressed denim. Goes with literally everything 💙 Tag us @luxe.boutique!",
      price: 95, originalPrice: 130, currency: "USD",
      images: ["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&h=700&fit=crop"],
      category: "clothing", tags: ["denim", "jacket", "vintage", "streetstyle", "ootd"],
      likes: 7120, comments: 418, shares: 312, isFeatured: true, isSoldOut: false, badge: "SALE",
      platform: "facebook", postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Square Sunglasses",
      description: "Serving main character energy ✨ UV400 protection. One size fits most. The summer essential you need.",
      price: 29, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1577744486770-020ab432da65?w=600&h=700&fit=crop"],
      category: "accessories", tags: ["sunglasses", "sunnies", "summer", "ootd", "accessories"],
      likes: 3850, comments: 156, shares: 98, isFeatured: false, isSoldOut: false, badge: null,
      platform: "instagram", postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Satin Slip Dress",
      description: "Slip into something luxurious 🥂 Liquid satin finish. Available in champagne, burgundy & navy. DM to order.",
      price: 85, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=700&fit=crop"],
      category: "clothing", tags: ["slipsdress", "satin", "eveningwear", "luxe", "dress"],
      likes: 9240, comments: 512, shares: 420, isFeatured: true, isSoldOut: false, badge: "HOT",
      platform: "instagram", postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Platform Sneakers",
      description: "Add 4 inches the cool way 😎 Platform sneakers with chunky sole. Streetwear approved. Limited sizes!",
      price: 110, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop"],
      category: "shoes", tags: ["sneakers", "platform", "streetstyle", "shoes", "kicks"],
      likes: 5470, comments: 289, shares: 198, isFeatured: false, isSoldOut: true, badge: "SOLD OUT",
      platform: "tiktok", postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Crystal Ring Set",
      description: "Stack them all 💎 Set of 5 adjustable rings with crystal detailing. One size fits all. Affordable luxury!",
      price: 24, originalPrice: 40, currency: "USD",
      images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=700&fit=crop"],
      category: "accessories", tags: ["rings", "crystals", "jewelry", "stackrings", "giftsforher"],
      likes: 4100, comments: 198, shares: 144, isFeatured: false, isSoldOut: false, badge: "SALE",
      platform: "facebook", postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
    {
      title: "Crochet Beach Bag",
      description: "Beach days & farmer's market vibes 🌊🌻 Handwoven crochet tote. Fits a towel, sunscreen & all your essentials.",
      price: 55, originalPrice: null, currency: "USD",
      images: ["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=700&fit=crop", "https://images.unsplash.com/photo-1597633125184-84af27f2d57e?w=600&h=700&fit=crop"],
      category: "bags", tags: ["crochet", "beachbag", "tote", "summerbag", "handmade"],
      likes: 3320, comments: 145, shares: 99, isFeatured: false, isSoldOut: false, badge: "NEW",
      platform: "instagram", postedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), sellerUsername, sellerAvatar,
    },
  ]);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
