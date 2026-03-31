import { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { Grid, SquareMenu, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { ProfileHeader } from "@/components/store/ProfileHeader";
import { Collections } from "@/components/store/StoryHighlights";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFeed } from "@/components/product/ProductFeed";
import { ProductDetailSheet } from "@/components/product/ProductDetailSheet";

type ViewMode = "grid" | "feed";

export default function StorePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: products, isLoading } = useListProducts();

  return (
    <MobileContainer>
      <ProfileHeader />
      <Collections />

      {/* View Toggle Bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border flex flex-col pt-3 pb-2 shadow-sm">
        {/* View Toggles */}
        <div className="flex justify-center items-center px-4">
          <div className="bg-muted rounded-xl p-1 flex items-center w-full max-w-[200px]">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex-1 flex justify-center py-1.5 rounded-lg transition-all",
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-5 h-5" strokeWidth={viewMode === "grid" ? 2.5 : 2} />
            </button>
            <button
              onClick={() => setViewMode("feed")}
              className={cn(
                "flex-1 flex justify-center py-1.5 rounded-lg transition-all",
                viewMode === "feed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SquareMenu className="w-5 h-5" strokeWidth={viewMode === "feed" ? 2.5 : 2} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[50vh] bg-background">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 p-2 animate-pulse mt-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-xl" />
            ))}
          </div>
        ) : products ? (
          viewMode === "grid" ? (
            <ProductGrid products={products} onProductClick={setSelectedProductId} />
          ) : (
            <ProductFeed products={products} onProductClick={setSelectedProductId} />
          )
        ) : null}
      </div>

      <ProductDetailSheet 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    </MobileContainer>
  );
}
