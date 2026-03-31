"use client";

import { useState } from "react";
import {
  useGetFeed,
  useAddToCart,
  useListMerchants,
  useToggleProductLike,
  type FeedProduct,
  type Merchant,
} from "@workspace/api-client-react";
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
  Search,
  Bell,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { ProductDetailSheet } from "@/components/product/ProductDetailSheet";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  patchLikeInCaches,
  restoreLikeCacheSnapshot,
  takeLikeCacheSnapshot,
} from "@/lib/like-cache";

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function normalizeMerchants(data: unknown): Merchant[] {
  if (Array.isArray(data)) return data as Merchant[];
  if (data && typeof data === "object" && "merchants" in data) {
    const nested = (data as { merchants?: unknown }).merchants;
    return Array.isArray(nested) ? (nested as Merchant[]) : [];
  }
  return [];
}

function FeedCard({
  item,
  onAddToCart,
  onProductClick,
}: {
  item: FeedProduct;
  onAddToCart: (id: number) => void;
  onProductClick: (id: number) => void;
}) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync: toggleLike } = useToggleProductLike();

  // Optimistic like state — null means "use server data"
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const isLiked =
    optimisticLiked !== null
      ? optimisticLiked
      : ((item as any).isLikedByMe ?? false);
  const likeCount = optimisticCount !== null ? optimisticCount : item.likes;

  const discount = item.originalPrice
    ? Math.round((1 - item.price / item.originalPrice) * 100)
    : null;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      login();
      return;
    }
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    const snapshot = takeLikeCacheSnapshot(queryClient);
    setOptimisticLiked(nextLiked);
    setOptimisticCount(nextCount);
    patchLikeInCaches(queryClient, item.id, nextLiked, nextCount);
    try {
      const result = await toggleLike({ id: item.id });
      setOptimisticLiked(result.liked);
      setOptimisticCount(result.likeCount);
      patchLikeInCaches(queryClient, item.id, result.liked, result.likeCount);
      setOptimisticLiked(null);
      setOptimisticCount(null);
    } catch {
      restoreLikeCacheSnapshot(queryClient, snapshot);
      setOptimisticLiked(null);
      setOptimisticCount(null);
    }
  };

  return (
    <div className="  overflow-hidden mb-2  ">
      {/* Product image — click to open detail sheet */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onProductClick(item.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onProductClick(item.id);
          }
        }}
        className="relative aspect-4/5 w-full bg-muted block overflow-hidden active:opacity-95 transition-opacity"
      >
        <img
          src={item.images[0]}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/65 via-black/35 to-transparent pointer-events-none" />
        <Link
          href={`/store/${item.merchantUsername}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 right-3 flex items-center gap-2.5 z-20 rounded-full bg-black/35 backdrop-blur-sm px-2 py-1"
        >
          <img
            src={item.merchantAvatar}
            alt={item.merchantDisplayName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/85"
          />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-white truncate">
                {item.merchantDisplayName}
              </span>
              {item.merchantIsVerified && (
                <span className="text-blue-300 text-xs">✓</span>
              )}
            </div>
            <span className="text-[11px] text-white/80 truncate">
              @{item.merchantUsername}
            </span>
          </div>
        </Link>
        {/* {item.badge && (
          <div className="absolute top-14 left-3 z-20 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {item.badge}
          </div>
        )}
        {discount && (
          <div className="absolute top-14 right-3 z-20 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )} */}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 px-3.5 pt-2.5 pb-1">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 active:scale-90 transition-transform"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isLiked ? "fill-red-500 text-red-500" : "text-foreground",
            )}
            strokeWidth={2}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {formatNum(likeCount)}
          </span>
        </button>
        <button
          onClick={() => onProductClick(item.id)}
          className="flex items-center gap-1"
        >
          <MessageCircle className="w-5 h-5 text-foreground" strokeWidth={2} />
          <span className="text-xs font-medium text-muted-foreground">
            {formatNum(item.comments)}
          </span>
        </button>
        <button className="flex items-center gap-1">
          <Share2 className="w-5 h-5 text-foreground" strokeWidth={2} />
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(item.id);
          }}
          disabled={item.isSoldOut}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95",
            item.isSoldOut
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {item.isSoldOut ? "Sold Out" : "Add"}
        </button>
      </div>

      {/* Product info */}
      <button
        onClick={() => onProductClick(item.id)}
        className="w-full text-left px-3.5 pb-3 pt-0.5"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-base text-foreground">
            ${item.price}
          </span>
          {item.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${item.originalPrice}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm text-foreground mt-0.5">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {item.description}
        </p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-primary font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

export default function FeedPage() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const { data: feed, isLoading } = useGetFeed({});
  const { data: merchants } = useListMerchants();
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: addToCart } = useAddToCart();
  const feedItems = Array.isArray(feed) ? feed : [];
  const merchantItems = normalizeMerchants(merchants);

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart({ data: { productId, quantity: 1 } });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart!" });
    } catch {
      toast({ title: "Could not add item", variant: "destructive" });
    }
  };

  return (
    <MobileContainer>
      <ProductDetailSheet
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl tracking-tight">
            SocialShop
          </h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">
            Discover · Shop · Connect
          </p>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Search className="w-4 h-4 text-foreground" />
        </button>
        {isAuthenticated ? (
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-4 h-4 text-foreground" />
          </button>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        )}
      </div>

      {/* Merchants Strip */}
      {merchantItems.length > 0 && (
        <div className="py-2 border-b border-border/50">
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-4">
            {merchantItems.map((m) => (
              <Link key={m.id} href={`/store/${m.username}`}>
                <div className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform">
                  <div className="w-14 mt-1 h-14 rounded-full ring-2 ring-primary/40 ring-offset-1 overflow-hidden">
                    <img
                      src={m.avatar}
                      alt={m.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-foreground w-16 text-center truncate">
                    {m.displayName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="pt-3 pb-20">
        {isLoading ? (
          <div className="flex flex-col gap-3 mx-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-muted animate-pulse h-80"
              />
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <ShoppingBag
              className="w-12 h-12 text-muted-foreground/40 mb-4"
              strokeWidth={1}
            />
            <p className="font-semibold text-foreground mb-1">
              No products yet
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for new items!
            </p>
          </div>
        ) : (
          feedItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              onProductClick={setSelectedProductId}
            />
          ))
        )}
      </div>
    </MobileContainer>
  );
}
