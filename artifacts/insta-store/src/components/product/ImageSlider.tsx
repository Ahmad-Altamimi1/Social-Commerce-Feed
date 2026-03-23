import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
  aspectClass?: string;
}

export function ImageSlider({ images, alt, className, aspectClass = "aspect-[4/5]" }: ImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const idx = Math.round(e.currentTarget.scrollLeft / width);
      setActiveIndex(idx);
    }
  };

  return (
    <div className={cn("relative w-full overflow-hidden", aspectClass, className)}>
      <div
        ref={containerRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        onScroll={handleScroll}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${alt} - ${i + 1}`}
            className="w-full h-full object-cover snap-center shrink-0 flex-none"
            style={{ width: "100%" }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                activeIndex === i ? "bg-white w-4" : "bg-white/50 w-1.5"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
