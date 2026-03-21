import { ShoppingBag } from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";

export default function CartPage() {
  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-[250px]">
          Looks like you haven't added any products to your cart yet. Discover items from the store!
        </p>
        <button 
          className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          onClick={() => window.history.back()}
        >
          Start Shopping
        </button>
      </div>
    </MobileContainer>
  );
}
