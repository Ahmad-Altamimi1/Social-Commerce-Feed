import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store, LogIn } from "lucide-react";
import { Link } from "wouter";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useAuth } from "@/lib/auth";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useClearCart } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: cart, isLoading, refetch } = useGetCart({ query: { enabled: isAuthenticated, refetchOnMount: "always" } });
  const { mutateAsync: updateItem } = useUpdateCartItem();
  const { mutateAsync: removeItem } = useRemoveFromCart();
  const { toast } = useToast();

  const handleQuantity = async (itemId: number, delta: number, current: number) => {
    const newQty = current + delta;
    try {
      if (newQty <= 0) {
        await removeItem({ itemId });
      } else {
        await updateItem({ itemId, data: { quantity: newQty } });
      }
      refetch();
    } catch {
      toast({ title: "Error updating cart", variant: "destructive" });
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem({ itemId });
      refetch();
      toast({ title: "Item removed" });
    } catch {
      toast({ title: "Error removing item", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Your Cart</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-[260px]">Sign in to see your cart and start shopping from multiple merchants.</p>
          <button
            onClick={login}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in to Shop
          </button>
        </div>
      </MobileContainer>
    );
  }

  if (isLoading) {
    return (
      <MobileContainer>
        <div className="px-4 py-4 space-y-4 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
        </div>
      </MobileContainer>
    );
  }

  if (!cart || cart.totalItems === 0) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mb-8">Discover products from our merchants!</p>
          <Link href="/">
            <button className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all">
              Start Shopping
            </button>
          </Link>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-bold text-2xl">My Cart</h1>
          <span className="text-sm text-muted-foreground">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
        </div>

        {/* Grouped by Merchant */}
        <div className="space-y-4 mb-24">
          {cart.groups.map((group) => (
            <div key={group.merchant.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              {/* Merchant header */}
              <Link href={`/store/${group.merchant.username}`}>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/50 bg-muted/30 active:bg-muted/50">
                  <img src={group.merchant.avatar} alt={group.merchant.displayName} className="w-7 h-7 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm">{group.merchant.displayName}</span>
                      {group.merchant.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                  </div>
                  <Store className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>

              {/* Items */}
              <div className="divide-y divide-border/50">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-20 h-20 rounded-xl object-cover bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2 mb-0.5">{item.product.title}</p>
                      <p className="font-bold text-primary text-sm">${item.product.price}</p>
                      {item.product.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">${item.product.originalPrice}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 bg-muted rounded-full px-1 py-0.5">
                          <button
                            onClick={() => handleQuantity(item.id, -1, item.quantity)}
                            className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantity(item.id, 1, item.quantity)}
                            className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-red-400 active:scale-90 transition-transform"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Merchant subtotal */}
              <div className="flex justify-between items-center px-3.5 py-2.5 bg-muted/20 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Subtotal from {group.merchant.displayName}</span>
                <span className="font-bold text-sm">${group.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed checkout bar */}
      <div className="fixed bottom-[68px] left-0 right-0 z-40 flex justify-center">
        <div className="w-full max-w-[428px] bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Order Total</span>
            <span className="font-display font-bold text-xl">${cart.total.toFixed(2)}</span>
          </div>
          <Link href="/checkout">
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all text-base">
              Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </MobileContainer>
  );
}
