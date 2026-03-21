import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader } from "@/components/ui/drawer";
import { useGetProduct } from "@workspace/api-client-react";
import { Heart, MessageCircle, Send, Bookmark, ShoppingBag, Store, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProductDetailSheetProps {
  productId: number | null;
  onClose: () => void;
}

export function ProductDetailSheet({ productId, onClose }: ProductDetailSheetProps) {
  const { data: product, isLoading } = useGetProduct(productId || 0, {
    query: { enabled: !!productId }
  });

  // Local optimistic state since no mutation endpoints
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (product) {
      setIsLiked(product.isLiked);
      setIsSaved(false);
      setActiveImage(0);
    }
  }, [product]);

  const platform = (product as any)?.platform || "instagram";
  const shares = (product as any)?.shares || Math.floor(Math.random() * 50);

  let platformColor = "bg-zinc-800";
  let platformLabel = "TikTok";
  if (platform === "instagram") {
    platformColor = "bg-[#E1306C]";
    platformLabel = "Instagram";
  } else if (platform === "facebook") {
    platformColor = "bg-[#1877F2]";
    platformLabel = "Facebook";
  }

  return (
    <Drawer open={!!productId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] flex flex-col rounded-t-[1.5rem] bg-background max-w-[428px] mx-auto border-x">
        <DrawerHeader className="hidden">
          <DrawerTitle>Product Details</DrawerTitle>
          <DrawerDescription>View product information and purchase</DrawerDescription>
        </DrawerHeader>
        
        {isLoading || !product ? (
          <div className="p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            {/* Header / Origin Info */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-10">
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

            {/* Image Carousel */}
            <div className="relative aspect-[4/5] bg-muted w-full overflow-hidden flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
                 onScroll={(e) => {
                   const width = e.currentTarget.clientWidth;
                   const index = Math.round(e.currentTarget.scrollLeft / width);
                   setActiveImage(index);
                 }}>
              {product.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt={`${product.title} - ${i + 1}`} 
                  className="w-full h-full object-cover snap-center shrink-0"
                />
              ))}
              
              {/* Pagination Dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {product.images.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        activeImage === i ? "bg-white w-4" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display font-bold text-2xl leading-tight text-foreground">{product.title}</h2>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-2xl text-primary">
                    {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm font-medium text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-y border-border/50 bg-card/30">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <Heart className={cn("w-6 h-6 transition-transform group-active:scale-75", isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                  <span className="text-xs font-semibold text-muted-foreground">{(product.likes + (isLiked ? (product.isLiked ? 0 : 1) : (product.isLiked ? -1 : 0))).toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center gap-1 group">
                  <MessageCircle className="w-6 h-6 text-muted-foreground transition-transform group-active:scale-75" />
                  <span className="text-xs font-semibold text-muted-foreground">{product.comments}</span>
                </button>
                <button className="flex flex-col items-center gap-1 group">
                  <Send className="w-6 h-6 text-muted-foreground transition-transform group-active:scale-75" />
                  <span className="text-xs font-semibold text-muted-foreground">{shares}</span>
                </button>
              </div>
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="flex flex-col items-center gap-1 group"
              >
                <Bookmark className={cn("w-6 h-6 transition-transform group-active:scale-75", isSaved ? "fill-foreground text-foreground" : "text-muted-foreground")} />
                <span className="text-xs font-semibold text-muted-foreground">Save</span>
              </button>
            </div>

            {/* Content Info */}
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {product.tags.map(tag => (
                  <span key={tag} className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
                Posted {formatDistanceToNow(new Date(product.postedAt), { addSuffix: true })}
              </div>
            </div>
            
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
        )}

        {/* Sticky Buy Button */}
        {product && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border z-20">
            <button 
              disabled={product.isSoldOut}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-base shadow-lg transition-all active:scale-[0.98]",
                product.isSoldOut 
                  ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              {product.isSoldOut ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
