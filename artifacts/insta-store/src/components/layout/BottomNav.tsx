import { Home, Search, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "/explore", label: "Explore" },
    { icon: ShoppingBag, path: "/cart", label: "Cart" },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around h-14 px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 transition-all duration-300", 
                  isActive && "fill-foreground scale-110"
                )} 
                strokeWidth={isActive ? 2 : 1.5} 
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
