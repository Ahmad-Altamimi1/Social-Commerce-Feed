import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function MobileContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-zinc-50 flex justify-center">
      {/* 
        This constraints the app to a mobile-sized container on desktop 
        to ensure the "social media" aspect ratio is maintained.
      */}
      <div className="w-full max-w-[428px] bg-background min-h-screen relative shadow-2xl sm:border-x sm:border-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16 no-scrollbar relative">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
