"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetProductBySlug, useAddToCart, useToggleProductLike,
  useListProductComments, useAddProductComment, useShareProduct,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart, MessageCircle, Send, Bookmark, ShoppingBag, Store,
  ChevronRight, ExternalLink, Loader2, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ImageSlider } from "@/components/product/ImageSlider";

function getSocialEmbedUrl(postUrl: string, platform: string): string | null {
  try {
    const url = new URL(postUrl);
    if (platform === "instagram" || url.hostname.includes("instagram.com")) {
      const match = url.pathname.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (match) return `https://www.instagram.com/p/${match[1]}/embed/captioned/`;
    }
    if (platform === "tiktok" || url.hostname.includes("tiktok.com")) {
      const match = url.pathname.match(/\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    if (platform === "facebook" || url.hostname.includes("facebook.com")) {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(postUrl)}&show_text=true&width=380&appId=`;
    }
  } catch {}
  return null;
}

function SocialPostEmbed({ postUrl, platform }: { postUrl: string; platform: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const embedUrl = getSocialEmbedUrl(postUrl, platform);

  if (!embedUrl || failed) {
    return (
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mx-5 my-3 px-4 py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-primary shrink-0" />
        View original post
      </a>
    );
  }

  const heights: Record<string, number> = { instagram: 560, tiktok: 740, facebook: 320 };
  const height = heights[platform] ?? 500;

  return (
    <div className="mx-5 my-3 rounded-2xl overflow-hidden border border-border bg-card relative" style={{ minHeight: loaded ? undefined : height }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}
      <iframe
        src={embedUrl}
        className="w-full border-none block"
        style={{ height, opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
        scrolling="no"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ProductPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: product, isLoading } = useGetProductBySlug(slug || "");
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: addToCart, isPending: addingToCart } = useAddToCart();
  const { mutateAsync: toggleLike, isPending: liking } = useToggleProductLike();
  const { mutateAsync: shareProductMutation } = useShareProduct();
  const { data: comments, refetch: refetchComments } = useListProductComments(product?.id || 0, {
    query: { queryKey: ["/api/products", product?.id, "comments"], enabled: !!product?.id },
  });
  const { mutateAsync: postComment, isPending: commenting } = useAddProductComment();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setIsLiked((product as any).isLikedByMe ?? false);
      setLikeCount(product.likes);
      setShareCount(product.shares);
      setIsSaved(false);
      setShowComments(false);
      setCommentText("");
    }
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart({ data: { productId: product.id, quantity: 1 } });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart!", description: product.title });
    } catch {
      toast({ title: "Could not add item", variant: "destructive" });
    }
  };

  const handleLike = async () => {
    if (!product) return;
    if (!isAuthenticated) { login(); return; }
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const result = await toggleLike({ id: product.id });
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareSlug = (product as { slug?: string }).slug ?? String(product.id);
    const productUrl = `${window.location.origin}/product/${shareSlug}`;
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

  const handleComment = async () => {
    if (!product) return;
    if (!isAuthenticated) { login(); return; }
    if (!commentText.trim()) return;
    try {
      await postComment({ id: product.id, data: { text: commentText.trim() } });
      setCommentText("");
      refetchComments();
    } catch {
      toast({ title: "Could not post comment", variant: "destructive" });
    }
  };

  const handleCommentIconClick = () => {
    if (!isAuthenticated) { login(); return; }
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const platform = (product as any)?.platform || "instagram";
  let platformColor = "bg-zinc-800";
  let platformLabel = "TikTok";
  if (platform === "instagram") { platformColor = "bg-[#E1306C]"; platformLabel = "Instagram"; }
  else if (platform === "facebook") { platformColor = "bg-[#1877F2]"; platformLabel = "Facebook"; }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen max-w-[428px] mx-auto bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Product</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen max-w-[428px] mx-auto bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Product not found</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">This product could not be found.</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm">
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-[428px] mx-auto bg-background">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm flex-1 truncate">{product.title}</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {/* Seller header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={product.sellerAvatar} alt={product.sellerUsername} className="w-10 h-10 rounded-full object-cover border border-border" />
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{product.sellerUsername}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${platformColor}`} />
                <span className="text-xs text-muted-foreground font-medium">via {platformLabel}</span>
              </div>
            </div>
          </div>
          <button className="text-primary font-semibold text-sm px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
            View Shop
          </button>
        </div>

        {/* Image Slider */}
        <ImageSlider images={product.images} alt={product.title} />

        {/* Price */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display font-bold text-2xl leading-tight text-foreground">{product.title}</h1>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-bold text-2xl text-primary">
                {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-sm font-medium text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-y border-border/50 bg-card/30">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} disabled={liking} className="flex flex-col items-center gap-1 group">
              <Heart className={cn(
                "w-6 h-6 transition-all group-active:scale-75",
                isLiked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"
              )} />
              <span className={cn("text-xs font-semibold transition-colors", isLiked ? "text-red-500" : "text-muted-foreground")}>
                {likeCount.toLocaleString()}
              </span>
            </button>

            <button onClick={handleCommentIconClick} className="flex flex-col items-center gap-1 group">
              <MessageCircle className="w-6 h-6 text-muted-foreground transition-transform group-active:scale-75" />
              <span className="text-xs font-semibold text-muted-foreground">{comments?.length ?? product.comments}</span>
            </button>

            <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
              <Send className="w-6 h-6 text-muted-foreground transition-transform group-active:scale-75" />
              <span className="text-xs font-semibold text-muted-foreground">{shareCount}</span>
            </button>
          </div>
          <button onClick={() => setIsSaved(!isSaved)} className="flex flex-col items-center gap-1 group">
            <Bookmark className={cn("w-6 h-6 transition-transform group-active:scale-75", isSaved ? "fill-foreground text-foreground" : "text-muted-foreground")} />
            <span className="text-xs font-semibold text-muted-foreground">Save</span>
          </button>
        </div>

        {/* Social Post Embed */}
        {(product as any).postUrl && (
          <div>
            <div className="flex items-center gap-2 px-5 pt-4 pb-1">
              <div className={cn("w-2 h-2 rounded-full", platformColor)} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original {platformLabel} Post</span>
            </div>
            <SocialPostEmbed postUrl={(product as any).postUrl} platform={platform} />
          </div>
        )}

        {/* Description + Tags */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">{product.description}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.tags.map((tag) => (
              <span key={tag} className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">#{tag}</span>
            ))}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
            Posted {formatDistanceToNow(new Date(product.postedAt), { addSuffix: true })}
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-5 pb-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full flex items-center justify-between py-3 border-t border-border/50"
          >
            <span className="font-semibold text-sm">
              Comments {comments?.length ? `(${comments.length})` : ""}
            </span>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", showComments ? "rotate-90" : "")} />
          </button>

          {showComments && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                  placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
                  disabled={!isAuthenticated || commenting}
                  className="flex-1 bg-muted/60 border border-border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commenting || !isAuthenticated}
                  className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all"
                >
                  {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {!comments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No comments yet — be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0 overflow-hidden">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {c.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2">
                      <p className="text-xs font-bold text-foreground leading-tight">{c.username}</p>
                      <p className="text-sm text-foreground/90 mt-0.5 leading-snug">{c.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* More from seller */}
        <div className="px-5 pt-2 pb-6">
          <button className="w-full bg-secondary/50 hover:bg-secondary border border-border rounded-xl p-4 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-lg shadow-sm border border-border">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">More from this seller</span>
                <span className="text-xs text-muted-foreground">View all items</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Sticky Buy Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px] p-4 bg-background/90 backdrop-blur-lg border-t border-border z-20">
        <button
          onClick={handleAddToCart}
          disabled={product.isSoldOut || addingToCart}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-base shadow-lg transition-all active:scale-[0.98]",
            product.isSoldOut
              ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
          )}
        >
          <ShoppingBag className="w-5 h-5" />
          {product.isSoldOut ? "Out of Stock" : addingToCart ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
