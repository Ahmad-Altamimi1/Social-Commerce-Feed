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
type PlatformFilter = "all" | "instagram" | "facebook" | "tiktok";

export default function StorePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Currently the API doesn't support platform filtering directly in the endpoint params according to generated types,
  // but we can pass it if it did, or just filter client side for demo purposes.
  // We'll just fetch all and filter client side.
  const { data: allProducts, isLoading } = useListProducts();

  const products = allProducts?.filter(p => {
    if (platformFilter === "all") return true;
    const pPlatform = (p as any).platform || ["instagram", "facebook", "tiktok"][p.id % 3]; // Mock if missing
    return pPlatform === platformFilter;
  });

  return (
    <MobileContainer>
      <ProfileHeader />
      <Collections />

      {/* Platform Filter & View Toggle Bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border flex flex-col pt-3 pb-2 shadow-sm">
        
        {/* Platform Pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 mb-3">
          <button 
            onClick={() => setPlatformFilter("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
              platformFilter === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All Items
          </button>
          
          <button 
            onClick={() => setPlatformFilter("instagram")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border",
              platformFilter === "instagram" ? "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30" : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", platformFilter === "instagram" ? "bg-[#E1306C]" : "bg-muted-foreground/40")} />
            Instagram
          </button>

          <button 
            onClick={() => setPlatformFilter("facebook")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border",
              platformFilter === "facebook" ? "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30" : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", platformFilter === "facebook" ? "bg-[#1877F2]" : "bg-muted-foreground/40")} />
            Facebook
          </button>

          <button 
            onClick={() => setPlatformFilter("tiktok")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border",
              platformFilter === "tiktok" ? "bg-zinc-800 text-white border-zinc-800" : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", platformFilter === "tiktok" ? "bg-white" : "bg-muted-foreground/40")} />
            TikTok
          </button>
        </div>

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
