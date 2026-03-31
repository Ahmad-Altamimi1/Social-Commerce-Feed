"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, useToggleProductLike, useShareProduct } from "@workspace/api-client-react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ImageSlider } from "@/components/product/ImageSlider";
import {
  patchLikeInCaches,
  restoreLikeCacheSnapshot,
  takeLikeCacheSnapshot,
} from "@/lib/like-cache";

interface ProductFeedProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

function FeedItem({ product, onClick }: { product: Product; onClick: () => void }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync: toggleLike } = useToggleProductLike();

  // Optimistic like state — null means "use server data"
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareCount, setShareCount] = useState((product as any).shares ?? 0);
  const router = useRouter();
  const { toast } = useToast();
  const { mutateAsync: shareProductMutation } = useShareProduct();

  const isLiked = optimisticLiked !== null ? optimisticLiked : ((product as any).isLikedByMe ?? false);
  const likeCount = optimisticCount !== null ? optimisticCount : product.likes;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { login(); return; }
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    const snapshot = takeLikeCacheSnapshot(queryClient);
    setOptimisticLiked(nextLiked);
    setOptimisticCount(nextCount);
    patchLikeInCaches(queryClient, product.id, nextLiked, nextCount);
    try {
      const result = await toggleLike({ id: product.id });
      setOptimisticLiked(result.liked);
      setOptimisticCount(result.likeCount);
      patchLikeInCaches(queryClient, product.id, result.liked, result.likeCount);
      setOptimisticLiked(null);
      setOptimisticCount(null);
    } catch {
      restoreLikeCacheSnapshot(queryClient, snapshot);
      setOptimisticLiked(null);
      setOptimisticCount(null);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = (product as any).slug || product.id.toString();
    const productUrl = `${window.location.origin}/product/${slug}`;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, url: productUrl });
        shared = true;
      } catch {}
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({ title: "Link copied!", description: "Product link copied to clipboard" });
        shared = true;
      } catch {
        toast({ title: "Could not share", variant: "destructive" });
      }
    }
    if (shared) {
      try {
        const result = await shareProductMutation({ id: product.id });
        setShareCount(result.shareCount);
      } catch {}
    }
  };

  const isTruncated = product.description.length > 80;
  const descToShow = showFullDesc ? product.description : `${product.description.slice(0, 80)}${isTruncated ? "..." : ""}`;

  const slug = (product as any).slug || product.id.toString();

  return (
    <article className="mx-3 my-4 bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Image Slider */}
      <div className="relative cursor-pointer" onClick={onClick}>
        <ImageSlider images={product.images} alt={product.title} aspectClass="aspect-[4/5]" />

        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start z-10">
          {product.isSoldOut ? (
            <div className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-md">
              Sold Out
            </div>
          ) : product.badge ? (
            <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-md shadow-sm">
              {product.badge}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3
            className="font-display font-bold text-lg leading-tight line-clamp-2 text-card-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push(`/product/${slug}`)}
          >
            {product.title}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-bold text-lg text-primary">
              {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Description & Tags */}
        <div className="text-sm mb-3 text-card-foreground/90">
          <span>{descToShow}</span>
          {isTruncated && !showFullDesc && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFullDesc(true); }}
              className="text-muted-foreground ml-1 font-medium hover:text-foreground"
            >
              read more
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions & Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <Heart className={cn("w-5 h-5 transition-colors group-active:scale-75", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
              <span className="text-xs font-semibold text-muted-foreground">
                {likeCount.toLocaleString()}
              </span>
            </button>
            <button onClick={onClick} className="flex items-center gap-1.5 group">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-active:scale-75 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">{product.comments}</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 group">
              <Send className="w-5 h-5 text-muted-foreground group-active:scale-75 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">{shareCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {formatDistanceToNow(new Date(product.postedAt))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
              className="active:scale-75 transition-transform"
            >
              <Bookmark className={cn("w-5 h-5 transition-colors", isSaved ? "fill-foreground text-foreground" : "text-muted-foreground")} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductFeed({ products, onProductClick }: ProductFeedProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <h3 className="font-semibold text-lg text-foreground">No items available</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-background pb-20">
      {products.map((product) => (
        <FeedItem key={product.id} product={product} onClick={() => onProductClick(product.id)} />
      ))}
    </div>
  );
}
