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
    <div className="grid grid-cols-3 gap-0.5 mt-0.5">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onProductClick(product.id)}
          className="relative aspect-square bg-muted overflow-hidden group cursor-pointer"
        >
          <img 
            src={product.images[0]} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.images.length > 1 && (
            <div className="absolute top-2 right-2 drop-shadow-md">
              <Square className="w-4 h-4 text-white fill-white/20" strokeWidth={2.5} />
            </div>
          )}
          {product.isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white text-[10px] font-bold tracking-widest uppercase bg-black/60 px-2 py-1 rounded">
                Sold Out
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
