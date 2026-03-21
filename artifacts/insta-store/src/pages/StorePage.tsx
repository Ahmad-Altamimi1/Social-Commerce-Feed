import { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { Grid, SquareMenu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { ProfileHeader } from "@/components/store/ProfileHeader";
import { StoryHighlights } from "@/components/store/StoryHighlights";
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
      <StoryHighlights />

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button
          onClick={() => setViewMode("grid")}
          className={cn(
            "flex-1 flex justify-center py-3 transition-colors relative",
            viewMode === "grid" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-6 h-6" strokeWidth={viewMode === "grid" ? 2 : 1.5} />
          {viewMode === "grid" && (
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setViewMode("feed")}
          className={cn(
            "flex-1 flex justify-center py-3 transition-colors relative",
            viewMode === "feed" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <SquareMenu className="w-6 h-6" strokeWidth={viewMode === "feed" ? 2 : 1.5} />
          {viewMode === "feed" && (
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted" />
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
