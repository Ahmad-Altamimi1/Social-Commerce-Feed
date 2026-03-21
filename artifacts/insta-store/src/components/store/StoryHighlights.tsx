import { useListHighlights } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StoryHighlights() {
  const { data: highlights, isLoading } = useListHighlights();

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    );
  }

  if (!highlights?.length) return null;

  return (
    <div className="w-full border-b border-border/50">
      <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 py-3 snap-x">
        {highlights.map((highlight) => (
          <button 
            key={highlight.id}
            className="flex flex-col items-center gap-1 group shrink-0 snap-start active:scale-95 transition-transform"
          >
            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
              <div className="bg-background rounded-full p-[2px]">
                <img 
                  src={highlight.coverImage || `${import.meta.env.BASE_URL}images/default-cover.png`} 
                  alt={highlight.title}
                  className="w-15 h-15 rounded-full object-cover border border-border/10"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-foreground/80 max-w-[70px] truncate">
              {highlight.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
