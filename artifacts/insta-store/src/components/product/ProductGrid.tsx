import { Product } from "@workspace/api-client-react";
import { Grid3X3, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Grid3X3 className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="font-semibold text-lg text-foreground">No posts yet</h3>
        <p className="text-sm">When they post products, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2 bg-background pb-20">
      {products.map((product) => {
        // Mock platform badge data
        const platform = (product as any).platform || ["instagram", "facebook", "tiktok"][Math.floor(Math.random() * 3)];
        
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
          <button
            key={product.id}
            onClick={() => onProductClick(product.id)}
            className="relative aspect-[3/4] bg-muted overflow-hidden rounded-xl shadow-sm group cursor-pointer border border-border"
          >
            <img 
              src={product.images[0]} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Top Info */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                {product.isSoldOut && (
                  <span className="bg-black/80 text-white text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md">
                    Sold
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-md", platformColor)}>
                  {platformLabel}
                </div>
                {product.images.length > 1 && (
                  <div className="bg-black/50 rounded-md p-1 backdrop-blur-sm">
                    <Square className="w-3 h-3 text-white fill-white/20" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 flex flex-col items-start text-left">
              <h4 className="text-white font-semibold text-sm line-clamp-1 w-full">{product.title}</h4>
              <span className="text-white font-bold mt-0.5">
                {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
