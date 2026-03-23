import { useLocation } from "wouter";
import { User, ShoppingBag, Clock, CheckCircle, Truck, XCircle, Package, LogIn, LogOut, ChevronRight } from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useAuth } from "@/lib/auth";
import { useListOrders } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
};

export default function ProfilePage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { data: orders, isLoading } = useListOrders({ query: { enabled: isAuthenticated } });
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to view your orders and manage your account.</p>
          <button onClick={login} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
        </div>
      </MobileContainer>
    );
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Shopper";

  return (
    <MobileContainer>
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={displayName} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-lg">{displayName}</h1>
            {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-2 bg-primary/10 text-primary font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-all"
          >
            <Package className="w-4 h-4" />
            My Store
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 bg-muted text-foreground font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="px-4 py-4">
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          My Orders
        </h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="font-semibold text-foreground mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6">Your order history will appear here.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-full text-sm active:scale-95 transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/20 border-b border-border/50">
                    <div>
                      <span className="font-bold text-sm">Order #{order.id}</span>
                      <p className="text-[11px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{order.address}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[...new Set(order.items.map((i) => i.merchantUsername))].map((m) => (
                        <span key={m} className="text-[11px] bg-muted text-foreground font-medium px-2 py-0.5 rounded-full">@{m}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {order.items.slice(0, 3).map((item) => (
                        item.image && <img key={item.id} src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover" />
                      ))}
                      {order.items.length > 3 && <span className="text-xs text-muted-foreground">+{order.items.length - 3}</span>}
                      <div className="flex-1" />
                      <span className="font-bold text-sm">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
