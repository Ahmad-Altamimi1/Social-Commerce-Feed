"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  User,
  FileText,
  ChevronLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useGetCart, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Step = "form" | "success";
type MapLocation = { lat: number; lng: number };

const LocationPickerMap = dynamic(
  () =>
    import("@/components/checkout/LocationPickerMap").then(
      (mod) => mod.LocationPickerMap,
    ),
  { ssr: false },
);

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useGetCart({
    query: { queryKey: ["/api/cart"], enabled: true },
  });
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [orderId, setOrderId] = useState<number | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerNotes: "",
    address: "",
    locationLat: undefined as number | undefined,
    locationLng: undefined as number | undefined,
  });
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const selectedLocation: MapLocation | null =
    form.locationLat !== undefined && form.locationLng !== undefined
      ? { lat: form.locationLat, lng: form.locationLng }
      : null;

  const handleLocationChange = async (location: MapLocation) => {
    setForm((f) => ({
      ...f,
      locationLat: location.lat,
      locationLng: location.lng,
    }));
    setResolvingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
      );
      const data = await res.json();
      const address =
        data.display_name ||
        `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
      setForm((f) => ({ ...f, address }));
    } catch {
      setForm((f) => ({
        ...f,
        address: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
      }));
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (form.locationLat === undefined || form.locationLng === undefined) {
      toast({
        title: "Please select delivery location on map",
        variant: "destructive",
      });
      return;
    }
    if (!form.address.trim()) {
      toast({
        title: "Resolving address, please try again",
        variant: "destructive",
      });
      return;
    }
    try {
      const order = await createOrder({
        data: {
          customerName: form.customerName,
          customerNotes: form.customerNotes || undefined,
          address: form.address,
          locationLat: form.locationLat,
          locationLng: form.locationLng,
        },
      });
      setOrderId(order.id);
      setStep("success");
    } catch (e: any) {
      toast({
        title: "Order failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (step === "success") {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">
            Order Placed!
          </h1>
          <p className="text-muted-foreground text-sm mb-1">Order #{orderId}</p>
          <p className="text-muted-foreground text-sm mb-8 max-w-[260px]">
            Your order has been placed. The merchants will prepare your items
            shortly.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all mb-3 w-full"
          >
            View My Orders
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
        <button
          onClick={() => router.push("/cart")}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display font-bold text-xl flex-1">Checkout</h1>
        {cart && (
          <span className="text-sm text-muted-foreground font-bold">
            ${cart.total.toFixed(2)}
          </span>
        )}
      </div>

      <div className="px-4 py-4 pb-32 space-y-5">
        {/* Order Summary */}
        {cart && cart.groups.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
              <h2 className="font-semibold text-sm">Order Summary</h2>
            </div>
            {cart.groups.map((group) => (
              <div
                key={group.merchant.id}
                className="px-4 py-2.5 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={group.merchant.avatar}
                    alt={group.merchant.displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {group.merchant.displayName}
                  </span>
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm mb-0.5"
                  >
                    <span className="text-foreground line-clamp-1 flex-1">
                      {item.product.title} × {item.quantity}
                    </span>
                    <span className="font-medium ml-2">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-muted/20">
              <span className="font-bold text-sm">Total</span>
              <span className="font-display font-bold text-primary text-lg">
                ${cart.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <User className="w-4 h-4 text-primary" />
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.customerName}
            onChange={(e) =>
              setForm((f) => ({ ...f, customerName: e.target.value }))
            }
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            Delivery Address
          </label>

          <LocationPickerMap
            value={selectedLocation}
            onChange={handleLocationChange}
          />

          <div className="mt-2 rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">
              Selected Address (auto)
            </p>
            {resolvingAddress ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Resolving address...
              </p>
            ) : form.address ? (
              <p className="text-sm text-foreground">{form.address}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a location on the map.
              </p>
            )}
          </div>
          {/* 
          {form.locationLat && (
            <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              GPS: {form.locationLat.toFixed(5)}, {form.locationLng?.toFixed(5)}
            </p>
          )} */}
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <FileText className="w-4 h-4 text-primary" />
            Order Notes{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            placeholder="Any special instructions, preferred delivery time..."
            value={form.customerNotes}
            onChange={(e) =>
              setForm((f) => ({ ...f, customerNotes: e.target.value }))
            }
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
        <div className="w-full max-w-[428px] bg-background/95 backdrop-blur-md border-t border-border px-4 py-4">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all text-base disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
              </>
            ) : (
              <>Place Order · ${cart?.total.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    </MobileContainer>
  );
}
