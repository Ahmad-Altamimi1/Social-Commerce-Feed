import { Home, Search, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGetCart } from "@workspace/api-client-react";

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, retry: false } });
  const totalItems = cart?.totalItems ?? 0;

  const baseItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "/explore", label: "Explore" },
    { icon: ShoppingBag, path: "/cart", label: "Cart", badge: isAuthenticated && totalItems > 0 ? totalItems : null },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  const allItems = isAuthenticated
    ? [...baseItems, { icon: LayoutDashboard, path: "/dashboard", label: "Sell", badge: null }]
    : baseItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-[68px] px-2 pb-safe max-w-md mx-auto">
        {allItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path} className="flex-1 flex justify-center items-center h-full">
              <div className={cn(
                "flex flex-col items-center justify-center w-[55px] h-[52px] rounded-2xl transition-all duration-300",
                isActive ? "bg-primary/10" : "hover:bg-muted/50"
              )}>
                <div className="relative">
                  <Icon
                    className={cn("h-[22px] w-[22px] mb-1 transition-all duration-300", isActive ? "text-primary fill-primary/20 scale-110" : "text-muted-foreground")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {Number(item.badge) > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={cn("text-[10px] font-semibold transition-colors duration-300", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
