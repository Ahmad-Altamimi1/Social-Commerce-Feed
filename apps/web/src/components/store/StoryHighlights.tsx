import { useListHighlights } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Collections() {
  const { data: highlights, isLoading } = useListHighlights();

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-5 overflow-hidden bg-background">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-[100px] h-[130px] rounded-xl shrink-0" />
        ))}
      </div>
    );
  }

  if (!highlights?.length) return null;

  return (
    <div className="w-full bg-background py-5 border-b border-border/50">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">Curated Collections</h3>
      </div>
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 snap-x">
        {highlights.map((highlight) => (
          <button 
            key={highlight.id}
            className="relative flex flex-col group shrink-0 snap-start active:scale-95 transition-transform overflow-hidden rounded-xl border border-border shadow-sm w-[100px] h-[130px]"
          >
            <img 
              src={highlight.coverImage || "/images/default-cover.png"} 
              alt={highlight.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Item count pill */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {Math.floor(Math.random() * 10 + 2)} items
            </div>

            {/* Title */}
            <span className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white leading-tight text-left line-clamp-2 shadow-sm">
              {highlight.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
