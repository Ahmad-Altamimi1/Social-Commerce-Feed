import { useState } from "react";
import { Product } from "@workspace/api-client-react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
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

  const isTruncated = product.description.length > 80;
  const descToShow = showFullDesc ? product.description : `${product.description.slice(0, 80)}${isTruncated ? '...' : ''}`;

  // Mock platform badge data
  const platform = (product as any).platform || ["instagram", "facebook", "tiktok"][Math.floor(Math.random() * 3)];
  const shares = (product as any).shares || Math.floor(Math.random() * 50);

  let platformColor = "bg-zinc-800 text-white";
  let platformLabel = "TK";
  if (platform === "instagram") {
    platformColor = "bg-[#E1306C] text-white";
    platformLabel = "IG";
  } else if (platform === "facebook") {
    platformColor = "bg-[#1877F2] text-white";
    platformLabel = "FB";
  } else if (platform === "tiktok") {
    platformColor = "bg-[#000000] text-white";
    platformLabel = "TT";
  }

  return (
    <article className="mx-3 my-4 bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Image */}
      <button onClick={onClick} className="relative aspect-[4/5] w-full bg-muted block overflow-hidden active:opacity-95 transition-opacity">
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-cover rounded-t-2xl"
          loading="lazy"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full shadow-md backdrop-blur-sm", platformColor)}>
            {platformLabel}
          </div>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
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
      </button>

      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 text-card-foreground">
            {product.title}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-bold text-lg text-primary">
              {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
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
          {product.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions & Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <Heart className={cn("w-5 h-5 transition-colors group-active:scale-75", isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
              <span className="text-xs font-semibold text-muted-foreground">
                {(product.likes + (isLiked ? (product.isLiked ? 0 : 1) : (product.isLiked ? -1 : 0))).toLocaleString()}
              </span>
            </button>
            <button onClick={onClick} className="flex items-center gap-1.5 group">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-active:scale-75 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">{product.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <Send className="w-5 h-5 text-muted-foreground group-active:scale-75 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">{shares}</span>
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
