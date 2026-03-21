import { useState } from "react";
import { Product } from "@workspace/api-client-react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProductFeedProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

function FeedItem({ product, onClick }: { product: Product; onClick: () => void }) {
  const [isLiked, setIsLiked] = useState(product.isLiked);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Local like toggle
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const isTruncated = product.description.length > 100;
  const descToShow = showFullDesc ? product.description : `${product.description.slice(0, 100)}${isTruncated ? '...' : ''}`;

  return (
    <article className="border-b border-border/50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
            <img src={product.sellerAvatar} alt={product.sellerUsername} className="w-full h-full rounded-full object-cover border border-background" />
          </div>
          <span className="font-semibold text-sm">{product.sellerUsername}</span>
        </div>
        <button className="p-1 text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <button onClick={onClick} className="relative aspect-[4/5] sm:aspect-square w-full bg-muted block overflow-hidden active:opacity-95 transition-opacity">
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {product.isSoldOut && (
          <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-md">
            Sold Out
          </div>
        )}
        {product.badge && !product.isSoldOut && (
          <div className="absolute top-3 left-3 bg-background/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-md shadow-sm">
            {product.badge}
          </div>
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="active:scale-75 transition-transform">
            <Heart className={cn("w-6 h-6 transition-colors", isLiked ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
          <button onClick={onClick} className="active:scale-75 transition-transform">
            <MessageCircle className="w-6 h-6 text-foreground" />
          </button>
          <button className="active:scale-75 transition-transform">
            <Send className="w-6 h-6 text-foreground" />
          </button>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
          className="active:scale-75 transition-transform"
        >
          <Bookmark className={cn("w-6 h-6 transition-colors", isSaved ? "fill-foreground text-foreground" : "text-foreground")} />
        </button>
      </div>

      {/* Details */}
      <div className="px-3 pb-4">
        <div className="font-semibold text-sm mb-1">
          {(product.likes + (isLiked ? (product.isLiked ? 0 : 1) : (product.isLiked ? -1 : 0))).toLocaleString()} likes
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm">
            {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
          </span>
          <span className="text-sm font-medium text-foreground">{product.title}</span>
        </div>

        <div className="text-sm">
          <span className="font-semibold mr-1.5">{product.sellerUsername}</span>
          <span className="text-foreground/90">{descToShow}</span>
          {isTruncated && !showFullDesc && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowFullDesc(true); }}
              className="text-muted-foreground ml-1 font-medium hover:text-foreground"
            >
              more
            </button>
          )}
        </div>

        {product.comments > 0 && (
          <button onClick={onClick} className="text-sm text-muted-foreground mt-1.5 font-medium">
            View all {product.comments} comments
          </button>
        )}

        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1.5">
          {formatDistanceToNow(new Date(product.postedAt))} ago
        </div>
      </div>
    </article>
  );
}

export function ProductFeed({ products, onProductClick }: ProductFeedProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <h3 className="font-semibold text-lg text-foreground">No posts yet</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-zinc-50 pb-8">
      {products.map((product) => (
        <FeedItem key={product.id} product={product} onClick={() => onProductClick(product.id)} />
      ))}
    </div>
  );
}
