import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Plus, Package, ShoppingCart, BarChart3, CheckCircle, Truck, Clock, XCircle,
  LogIn, Store, Edit, Trash2, X, ImagePlus, Tag, DollarSign, AlignLeft, Layers, Link2, Star,
  PenLine, Link,
} from "lucide-react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useAuth } from "@/lib/auth";
import {
  useGetMyMerchantProfile, useRegisterMerchant, useListMyProducts,
  useGetMerchantOrders, useUpdateOrderStatus, useDeleteProduct,
  useCreateProduct, useUpdateProduct,
  getListMyProductsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tab = "overview" | "orders" | "products";

const CATEGORIES = ["clothing", "beauty", "accessories", "home", "outdoors", "electronics", "food", "sports", "other"];
const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
];
const BADGES = ["", "New", "Sale", "Hot", "Limited", "Best Seller"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
};

type ProductFormData = {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  platform: string;
  tags: string;
  images: string;
  badge: string;
  isFeatured: boolean;
  postUrl: string;
};

const EMPTY_FORM: ProductFormData = {
  title: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "clothing",
  platform: "instagram",
  tags: "",
  images: "",
  badge: "",
  isFeatured: false,
  postUrl: "",
};

type WizardMode = "pick" | "scratch" | "social";

function ProductSheet({
  open,
  onClose,
  initial,
  productId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ProductFormData;
  productId?: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [wizardMode, setWizardMode] = useState<WizardMode>(productId ? "scratch" : "pick");
  const [form, setForm] = useState<ProductFormData>(initial ?? EMPTY_FORM);
  const { mutateAsync: create, isPending: creating } = useCreateProduct();
  const { mutateAsync: update, isPending: updating } = useUpdateProduct();
  const isPending = creating || updating;

  const set = (key: keyof ProductFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const hasPostUrl = form.postUrl.trim().length > 0;
  const imagesRequired = wizardMode !== "social";

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast({ title: "Product title is required", variant: "destructive" }); return; }
    if (!form.price || isNaN(Number(form.price))) { toast({ title: "Valid price is required", variant: "destructive" }); return; }
    if (imagesRequired && !form.images.trim()) { toast({ title: "At least one image URL is required", variant: "destructive" }); return; }
    if (wizardMode === "social") {
      if (!form.postUrl.trim()) { toast({ title: "Please enter a social post URL", variant: "destructive" }); return; }
      try {
        const parsedPost = new URL(form.postUrl.trim());
        const validHosts = ["instagram.com", "www.instagram.com", "tiktok.com", "www.tiktok.com", "vm.tiktok.com"];
        if (!validHosts.includes(parsedPost.hostname)) {
          toast({ title: "Invalid post URL", description: "Only Instagram and TikTok post URLs are supported.", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Invalid post URL", description: "Please enter a valid URL.", variant: "destructive" });
        return;
      }
    }

    const images = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
    const tags = form.tags.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      category: form.category,
      platform: form.platform,
      tags,
      images,
      badge: form.badge || undefined,
      isFeatured: form.isFeatured,
      postUrl: form.postUrl.trim() || undefined,
    };

    try {
      if (productId) {
        await update({ id: productId, data: payload });
        toast({ title: "Product updated!" });
      } else {
        await create({ data: payload });
        toast({ title: "Product created!", description: "It's now live in your store." });
      }
      onSuccess();
      handleClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Something went wrong", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setWizardMode(productId ? "scratch" : "pick");
    setForm(initial ?? EMPTY_FORM);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 428, margin: "0 auto" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-background rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {wizardMode !== "pick" && !productId && (
              <button
                onClick={() => setWizardMode("pick")}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted active:bg-muted/70 transition-colors mr-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <h2 className="font-display font-bold text-lg">
              {productId ? "Edit Product" : wizardMode === "pick" ? "Add New Product" : wizardMode === "social" ? "Link a Social Post" : "Start from Scratch"}
            </h2>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-muted/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Picker (new products only) */}
        {wizardMode === "pick" && (
          <div className="flex-1 px-5 py-6 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">How would you like to add your product?</p>
            <button
              onClick={() => { setForm({ ...EMPTY_FORM }); setWizardMode("scratch"); }}
              className="flex items-start gap-4 p-5 bg-card border-2 border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <PenLine className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">Start from scratch</p>
                <p className="text-sm text-muted-foreground mt-0.5">Enter product details manually and upload your own images.</p>
              </div>
            </button>
            <button
              onClick={() => { setForm({ ...EMPTY_FORM, platform: "instagram" }); setWizardMode("social"); }}
              className="flex items-start gap-4 p-5 bg-card border-2 border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Link className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">Link a social post</p>
                <p className="text-sm text-muted-foreground mt-0.5">Paste an Instagram or TikTok post URL. The post will be embedded in your product — no image required.</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Form */}
        {wizardMode !== "pick" && (
          <>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Social post fields — shown first & prominently for social mode */}
              {wizardMode === "social" && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Social Post Details</p>
                  <div>
                    <label className="field-label text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Platform</label>
                    <select
                      value={form.platform}
                      onChange={(e) => set("platform", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      {PLATFORMS.filter((p) => p.value !== "facebook").map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                      <Link2 className="w-3 h-3" /> Post URL <span className="text-primary">*</span>
                    </label>
                    <input
                      type="url"
                      placeholder={
                        form.platform === "instagram"
                          ? "https://www.instagram.com/p/ABC123/"
                          : "https://www.tiktok.com/@user/video/1234567890"
                      }
                      value={form.postUrl}
                      onChange={(e) => set("postUrl", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {form.postUrl.trim() && (
                      <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1">
                        <span>✓</span> The post will be embedded in the product detail view
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  <Layers className="w-3 h-3" /> Product Title <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vintage Floral Dress"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  <AlignLeft className="w-3 h-3" /> Description
                </label>
                <textarea
                  placeholder="Describe your product..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    <DollarSign className="w-3 h-3" /> Price <span className="text-primary">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="29.99"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    <DollarSign className="w-3 h-3" /> Original Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="49.99"
                    value={form.originalPrice}
                    onChange={(e) => set("originalPrice", e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Category + Platform (scratch mode shows platform selector here) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all capitalize"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                {wizardMode === "scratch" && (
                  <div>
                    <label className="field-label text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Platform</label>
                    <select
                      value={form.platform}
                      onChange={(e) => set("platform", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Badge + Featured */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    <Star className="w-3 h-3" /> Badge
                  </label>
                  <select
                    value={form.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => set("isFeatured", !form.isFeatured)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                    form.isFeatured
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-muted-foreground"
                  )}
                >
                  <Star className={cn("w-4 h-4", form.isFeatured ? "fill-primary text-primary" : "")} />
                  Featured
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  <Tag className="w-3 h-3" /> Tags <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. summer, floral, women, trendy"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Images */}
              <div>
                <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  <ImagePlus className="w-3 h-3" /> Image URLs
                  {imagesRequired ? <span className="text-primary">*</span> : <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">(optional — embed will serve as visual)</span>}
                  {imagesRequired && <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">(one per line)</span>}
                </label>
                <textarea
                  placeholder={"https://images.unsplash.com/photo-...\nhttps://images.unsplash.com/photo-..."}
                  value={form.images}
                  onChange={(e) => set("images", e.target.value)}
                  rows={3}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none font-mono text-xs"
                />
                {form.images.trim() && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.split("\n").map((url) => url.trim()).filter(Boolean).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover bg-muted border border-border" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                    ))}
                  </div>
                )}
                {wizardMode === "social" && !form.images.trim() && hasPostUrl && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <span className="text-blue-500">ℹ</span> The embedded social post will serve as the product visual
                  </p>
                )}
              </div>

              {/* Social Post URL (scratch mode) */}
              {wizardMode === "scratch" && (
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    <Link2 className="w-3 h-3" /> Social Post URL
                    <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">(optional — embeds original post)</span>
                  </label>
                  <input
                    type="url"
                    placeholder={
                      form.platform === "instagram"
                        ? "https://www.instagram.com/p/ABC123/"
                        : form.platform === "tiktok"
                        ? "https://www.tiktok.com/@user/video/1234567890"
                        : "https://www.facebook.com/your_page/posts/123456"
                    }
                    value={form.postUrl}
                    onChange={(e) => set("postUrl", e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  {form.postUrl.trim() && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span className="text-green-500">✓</span>
                      The original post will be embedded in the product detail view
                    </p>
                  )}
                </div>
              )}

              <div className="h-4" />
            </div>

            {/* Submit button */}
            <div className="shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 border-t border-border bg-background">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all text-base disabled:opacity-60"
              >
                {isPending ? (productId ? "Saving..." : "Creating...") : (productId ? "Save Changes" : "Create Product")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RegisterForm() {
  const { mutateAsync: register, isPending } = useRegisterMerchant();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: "", displayName: "", bio: "", category: "", location: "", website: "" });

  const handleSubmit = async () => {
    if (!form.username || !form.displayName) { toast({ title: "Username and name are required", variant: "destructive" }); return; }
    try {
      await register({ data: form });
      toast({ title: "Store created!", description: "Welcome to SocialShop!" });
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl">Become a Merchant</h2>
        <p className="text-sm text-muted-foreground mt-1">Set up your store and start selling today</p>
      </div>

      {[
        { key: "username", label: "Store Username", placeholder: "e.g. my.store" },
        { key: "displayName", label: "Store Name", placeholder: "e.g. My Fashion Store" },
        { key: "bio", label: "Bio", placeholder: "Tell customers about your store..." },
        { key: "category", label: "Category", placeholder: "e.g. Fashion, Beauty, Outdoors" },
        { key: "location", label: "Location", placeholder: "e.g. New York, NY" },
        { key: "website", label: "Website (optional)", placeholder: "e.g. mystore.com" },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
          <input
            type="text"
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all text-base mt-2 disabled:opacity-60"
      >
        {isPending ? "Creating Store..." : "Create My Store"}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: number; form: ProductFormData } | null>(null);
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const { data: merchant, isLoading: merchantLoading } = useGetMyMerchantProfile({ query: { enabled: isAuthenticated } });
  const { data: products, refetch: refetchProducts } = useListMyProducts({ query: { enabled: !!merchant } });
  const { data: orders } = useGetMerchantOrders({ query: { enabled: !!merchant } });
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { toast } = useToast();

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
    refetchProducts();
  };

  if (!isAuthenticated) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <LayoutDashboard className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Merchant Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to manage your store and orders.</p>
          <button onClick={login} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
        </div>
      </MobileContainer>
    );
  }

  if (merchantLoading) {
    return (
      <MobileContainer>
        <div className="px-4 py-6 space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
        </div>
      </MobileContainer>
    );
  }

  if (!merchant) {
    return (
      <MobileContainer>
        <div className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3">
          <h1 className="font-display font-bold text-xl">Merchant Dashboard</h1>
        </div>
        <RegisterForm />
      </MobileContainer>
    );
  }

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateStatus({ id: orderId, data: { status: status as any } });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct({ id });
      invalidateProducts();
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error deleting product", variant: "destructive" });
    }
  };

  const openEdit = (p: NonNullable<typeof products>[number]) => {
    setEditingProduct({
      id: p.id,
      form: {
        title: p.title,
        description: p.description ?? "",
        price: String(p.price),
        originalPrice: p.originalPrice ? String(p.originalPrice) : "",
        category: p.category,
        platform: p.platform,
        tags: p.tags.join(", "),
        images: p.images.join("\n"),
        badge: p.badge ?? "",
        isFeatured: p.isFeatured ?? false,
        postUrl: (p as any).postUrl ?? "",
      },
    });
  };

  const totalRevenue = orders?.reduce((s, o) => s + o.total, 0) ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length ?? 0;
  const totalLikes = products?.reduce((s, p) => s + ((p as any).likes ?? 0), 0) ?? 0;
  const totalComments = products?.reduce((s, p) => s + ((p as any).comments ?? 0), 0) ?? 0;

  return (
    <MobileContainer>
      {/* Product Create Sheet */}
      <ProductSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onSuccess={invalidateProducts}
      />

      {/* Product Edit Sheet */}
      {editingProduct && (
        <ProductSheet
          open={true}
          onClose={() => setEditingProduct(null)}
          initial={editingProduct.form}
          productId={editingProduct.id}
          onSuccess={invalidateProducts}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <img src={merchant.avatar} alt={merchant.displayName} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
          <div className="flex-1">
            <h1 className="font-display font-bold text-base">{merchant.displayName}</h1>
            <p className="text-[11px] text-muted-foreground">@{merchant.username}</p>
          </div>
          {pendingOrders > 0 && (
            <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {pendingOrders} new order{pendingOrders > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {([
            { id: "overview", icon: BarChart3, label: "Overview" },
            { id: "orders", icon: ShoppingCart, label: "Orders" },
            { id: "products", icon: Package, label: "Products" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-24">
        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, sub: "All time" },
                { label: "Orders", value: orders?.length ?? 0, sub: `${pendingOrders} pending` },
                { label: "Products", value: products?.length ?? 0, sub: "Listed" },
                { label: "Rating", value: merchant.rating > 0 ? `${merchant.rating}★` : "—", sub: `${merchant.reviewCount} reviews` },
                { label: "Total Likes", value: totalLikes.toLocaleString(), sub: "Across all products" },
                { label: "Comments", value: totalComments.toLocaleString(), sub: "Across all products" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-card rounded-2xl border border-border/50 p-3.5">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-display font-bold text-xl text-foreground">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {merchant.socialLinks.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <h3 className="font-semibold text-sm mb-3">Connected Platforms</h3>
                <div className="space-y-2">
                  {merchant.socialLinks.map((sl) => (
                    <div key={sl.platform} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{sl.platform}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {sl.followerCount ? `${(sl.followerCount / 1000).toFixed(1)}k` : sl.handle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action to add product from overview */}
            <button
              onClick={() => { setTab("products"); setShowCreateSheet(true); }}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="px-4 py-4 space-y-3">
            {!orders?.length ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={order.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/50">
                      <div>
                        <span className="font-bold text-sm">Order #{order.id}</span>
                        <p className="text-[11px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="px-3.5 py-2.5">
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{order.address}</p>
                      {order.customerNotes && <p className="text-xs text-muted-foreground italic mt-0.5">"{order.customerNotes}"</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        <span className="font-bold text-sm">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="px-3.5 pb-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="w-full bg-muted text-foreground text-xs font-medium px-3 py-2 rounded-xl border border-border outline-none"
                      >
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => setShowCreateSheet(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 text-primary font-semibold py-3.5 rounded-2xl hover:bg-primary/5 active:scale-[0.98] transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>

            {!products?.length ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No products yet — add your first one!</p>
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl border border-border/50 flex gap-3 p-3">
                  <img src={p.images[0]} alt={p.title} className="w-16 h-16 rounded-xl object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.platform} · {p.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-bold text-primary text-sm">${p.price}</p>
                      {p.originalPrice && <p className="text-xs text-muted-foreground line-through">${p.originalPrice}</p>}
                      {p.badge && <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p.badge}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Edit className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
