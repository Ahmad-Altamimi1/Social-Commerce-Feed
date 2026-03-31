import { useState } from "react";
import { Search, X } from "lucide-react";
import { useGetFeed } from "@workspace/api-client-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { ProductDetailSheet } from "@/components/product/ProductDetailSheet";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { slug: "clothing", label: "Clothing", emoji: "👗" },
  { slug: "beauty", label: "Beauty", emoji: "💄" },
  { slug: "accessories", label: "Accessories", emoji: "👜" },
  { slug: "home", label: "Home", emoji: "🏡" },
  { slug: "outdoors", label: "Outdoors", emoji: "🏕️" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#000000",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  tiktok: "TT",
};

function normalizeFeed(data: unknown) {
  return Array.isArray(data) ? data : [];
}

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: products, isLoading } = useGetFeed({ category: selectedCategory, limit: 60 });
  const productItems = normalizeFeed(products);

  const filtered = productItems.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.merchantDisplayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileContainer>
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or merchants..."
            className="w-full bg-muted/60 border border-transparent rounded-2xl py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              !selectedCategory
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground border-border"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? undefined : cat.slug)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                selectedCategory === cat.slug
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border"
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-[60vh] pb-24">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5 animate-pulse">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-semibold text-foreground">No results</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `No products match "${search}"` : "Nothing in this category yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {filtered.map((product) => {
              const platformColor = PLATFORM_COLORS[product.platform] ?? "#999";
              const platformLabel = PLATFORM_LABELS[product.platform] ?? "?";
              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="relative aspect-square overflow-hidden group active:scale-[0.97] transition-transform"
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-active:opacity-100 transition-opacity" />

                  {/* Platform badge */}
                  <span
                    className="absolute top-1.5 right-1.5 text-[9px] font-black text-white rounded px-1 py-0.5 leading-none"
                    style={{ backgroundColor: platformColor }}
                  >
                    {platformLabel}
                  </span>

                  {/* Price on active */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-active:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold">${product.price}</p>
                    <p className="text-white/80 text-[10px] truncate">{product.title}</p>
                  </div>

                  {product.badge && (
                    <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {product.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result count */}
      {!isLoading && filtered.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {selectedCategory ? ` in ${CATEGORIES.find((c) => c.slug === selectedCategory)?.label}` : ""}
          {search ? ` matching "${search}"` : ""}
        </div>
      )}

      <ProductDetailSheet productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
    </MobileContainer>
  );
}
