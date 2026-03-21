import { useState } from "react";
import { useListCategories, useListProducts } from "@workspace/api-client-react";
import { Search } from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductDetailSheet } from "@/components/product/ProductDetailSheet";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: products, isLoading: prodsLoading } = useListProducts({ category: selectedCategory });

  return (
    <MobileContainer>
      {/* Search Header */}
      <div className="p-3 sticky top-0 bg-background/95 backdrop-blur z-20 border-b border-border/50">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-muted/50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-border transition-colors"
          />
        </div>
      </div>

      {/* Category Chips */}
      {!catsLoading && categories && (
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-3 py-3 border-b border-border/50">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0",
              !selectedCategory 
                ? "bg-foreground text-background border-foreground" 
                : "bg-background text-foreground border-border hover:border-foreground/30"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0 flex items-center gap-1.5",
                selectedCategory === cat.slug
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-background text-foreground border-border hover:border-foreground/30"
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Explore Grid */}
      <div className="min-h-[60vh]">
        {prodsLoading ? (
          <div className="grid grid-cols-3 gap-0.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="aspect-square bg-muted" />
            ))}
          </div>
        ) : products ? (
          <ProductGrid products={products} onProductClick={setSelectedProductId} />
        ) : null}
      </div>

      <ProductDetailSheet 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    </MobileContainer>
  );
}
