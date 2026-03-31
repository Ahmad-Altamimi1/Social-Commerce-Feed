"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle,
  MapPin,
  ExternalLink,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import {
  useGetMerchant,
  useGetMerchantProducts,
  useGetMerchantHighlights,
  useAddToCart,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFeed } from "@/components/product/ProductFeed";
import { ProductDetailSheet } from "@/components/product/ProductDetailSheet";
import { cn } from "@/lib/utils";
import { LayoutGrid, SquareMenu } from "lucide-react";

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

type ViewMode = "grid" | "feed";

export default function MerchantStorePage({ username }: { username: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const { toast } = useToast();

  const { data: merchant, isLoading: merchantLoading } = useGetMerchant(
    username ?? "",
  );
  const { data: allProducts, isLoading: productsLoading } =
    useGetMerchantProducts(username ?? "");
  const { data: highlights } = useGetMerchantHighlights(username ?? "");
  const { mutateAsync: addToCart } = useAddToCart();

  const products = allProducts;

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart({ data: { productId, quantity: 1 } });
      toast({ title: "Added to cart!" });
    } catch {
      toast({ title: "Could not add item", variant: "destructive" });
    }
  };

  if (merchantLoading) {
    return (
      <MobileContainer>
        <div className="animate-pulse">
          <div className="h-48 bg-muted" />
          <div className="px-4 py-3 space-y-2">
            <div className="h-5 bg-muted rounded w-40" />
            <div className="h-3 bg-muted rounded w-24" />
          </div>
        </div>
      </MobileContainer>
    );
  }

  if (!merchant) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <p className="font-semibold text-lg mb-2">Merchant not found</p>
          <button
            onClick={() => router.push("/")}
            className="text-primary text-sm font-medium"
          >
            Go back home
          </button>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      {/* Cover */}
      <div className="relative">
        {merchant.coverImage ? (
          <img
            src={merchant.coverImage}
            alt="Cover"
            className="w-full h-48 object-cover object-center"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <img
          src={merchant.avatar}
          alt={merchant.displayName}
          className="absolute left-4 bottom-0 translate-y-1/2 w-20 h-20 rounded-2xl object-cover ring-4 ring-background shadow-md bg-background"
        />
      </div>

      {/* Profile info */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="flex justify-end mb-2">
          <div className="flex gap-2">
            <button className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all">
              Follow
            </button>
            <button className="border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-full active:scale-95 transition-all">
              Message
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-0.5">
          <h1 className="font-display font-bold text-xl">
            {merchant.displayName}
          </h1>
          {merchant.isVerified && (
            <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
          )}
        </div>
        {merchant.tagline && (
          <p className="text-sm text-muted-foreground mb-2">
            {merchant.tagline}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-3 mb-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-3 py-1.5 shrink-0">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold">
              {formatFollowers(merchant.totalFollowers)}
            </span>
            <span className="text-[10px] text-muted-foreground">Followers</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-3 py-1.5 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold">
              {formatFollowers(merchant.totalSales)}
            </span>
            <span className="text-[10px] text-muted-foreground">Sales</span>
          </div>
          {(merchant.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-3 py-1.5 shrink-0">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold">{merchant.rating ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">Rating</span>
            </div>
          )}
        </div>

        {/* Social links */}
        {merchant.socialLinks.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-3">
            {merchant.socialLinks.map((sl) => {
              return (
                <a
                  key={`${sl.url}-${sl.handle}`}
                  href={sl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-border bg-card rounded-full px-3 py-1 shrink-0"
                >
                  <span className="text-xs font-medium text-foreground">
                    {sl.handle}
                  </span>
                  {sl.followerCount && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatFollowers(sl.followerCount)}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {merchant.bio && (
          <p className="text-sm text-foreground leading-relaxed mb-2">
            {merchant.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {merchant.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {merchant.location}
            </span>
          )}
          {merchant.website && (
            <a
              href={`https://${merchant.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              {merchant.website}
            </a>
          )}
        </div>
      </div>

      {/* Collections / Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="w-full bg-background py-4 border-b border-border/50">
          <div className="px-4 mb-3">
            <h3 className="font-display font-bold text-base">Collections</h3>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 snap-x">
            {highlights.map((h) => (
              <button
                key={h.id}
                className="relative flex flex-col group shrink-0 snap-start active:scale-95 transition-transform overflow-hidden rounded-xl border border-border shadow-sm w-[90px] h-[115px]"
              >
                <img
                  src={h.coverImage}
                  alt={h.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[11px] font-semibold text-white leading-tight text-left line-clamp-2">
                  {h.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border flex flex-col pt-3 pb-2 shadow-sm">
        <div className="flex justify-center px-4">
          <div className="bg-muted rounded-xl p-1 flex items-center w-full max-w-[180px]">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex-1 flex justify-center py-1.5 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <LayoutGrid
                className="w-5 h-5"
                strokeWidth={viewMode === "grid" ? 2.5 : 2}
              />
            </button>
            <button
              onClick={() => setViewMode("feed")}
              className={cn(
                "flex-1 flex justify-center py-1.5 rounded-lg transition-all",
                viewMode === "feed"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <SquareMenu
                className="w-5 h-5"
                strokeWidth={viewMode === "feed" ? 2.5 : 2}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="min-h-[50vh] bg-background">
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-2 p-2 animate-pulse mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-xl" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          viewMode === "grid" ? (
            <ProductGrid
              products={products}
              onProductClick={setSelectedProductId}
            />
          ) : (
            <ProductFeed
              products={products}
              onProductClick={setSelectedProductId}
            />
          )
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              No products in this view
            </p>
          </div>
        )}
      </div>

      <ProductDetailSheet
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </MobileContainer>
  );
}
