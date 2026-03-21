import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader } from "@/components/ui/drawer";
import { useGetProduct } from "@workspace/api-client-react";
import { Heart, MessageCircle, Send, Bookmark, ShoppingBag } from "lucide-react";
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
          <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            {/* Header / Seller Info */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
              <img src={product.sellerAvatar} alt={product.sellerUsername} className="w-8 h-8 rounded-full object-cover" />
              <span className="font-semibold text-sm">{product.sellerUsername}</span>
            </div>

            {/* Image Carousel */}
            <div className="relative aspect-square bg-muted w-full overflow-hidden flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
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
                        activeImage === i ? "bg-primary w-3" : "bg-white/60"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className="active:scale-75 transition-transform"
                >
                  <Heart className={cn("w-6 h-6 transition-colors", isLiked ? "fill-destructive text-destructive" : "text-foreground")} />
                </button>
                <button className="active:scale-75 transition-transform">
                  <MessageCircle className="w-6 h-6 text-foreground" />
                </button>
                <button className="active:scale-75 transition-transform">
                  <Send className="w-6 h-6 text-foreground" />
                </button>
              </div>
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="active:scale-75 transition-transform"
              >
                <Bookmark className={cn("w-6 h-6 transition-colors", isSaved ? "fill-foreground text-foreground" : "text-foreground")} />
              </button>
            </div>

            {/* Likes count */}
            <div className="px-4 pb-2">
              <span className="font-semibold text-sm">
                {(product.likes + (isLiked ? (product.isLiked ? 0 : 1) : (product.isLiked ? -1 : 0))).toLocaleString()} likes
              </span>
            </div>

            {/* Content Info */}
            <div className="px-4 flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <h2 className="font-display font-bold text-xl leading-none">{product.title}</h2>
                {product.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                    {product.badge}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-muted-foreground text-sm line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="text-sm">
                <span className="font-semibold mr-2">{product.sellerUsername}</span>
                <span className="text-foreground/90 whitespace-pre-wrap">{product.description}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-1">
                {product.tags.map(tag => (
                  <span key={tag} className="text-primary text-sm hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-2">
                {formatDistanceToNow(new Date(product.postedAt), { addSuffix: true })}
              </div>
            </div>

            {/* View all comments */}
            <div className="px-4 py-3 mt-2 border-t border-border/30">
              <button className="text-sm text-muted-foreground">
                View all {product.comments} comments
              </button>
            </div>
          </div>
        )}

        {/* Sticky Buy Button */}
        {product && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border">
            <button 
              disabled={product.isSoldOut}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98]",
                product.isSoldOut 
                  ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              {product.isSoldOut ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
