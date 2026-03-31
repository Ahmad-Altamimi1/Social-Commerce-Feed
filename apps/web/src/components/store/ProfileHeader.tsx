import { useGetStore } from "@workspace/api-client-react";
import { BadgeCheck, Link as LinkIcon, MapPin, Star, TrendingUp, Users, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeader() {
  const { data: store, isLoading } = useGetStore();

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Skeleton className="w-full h-44 rounded-none" />
        <div className="px-4 -mt-10 space-y-4">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
          <Skeleton className="w-1/2 h-6" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>
    );
  }

  if (!store) return null;

  const defaultAvatar = "/images/default-avatar.png";
  const defaultCover = "/images/default-cover.png";

  // Fallbacks for demo/mock data missing properties
  const totalFollowers = (store as any).totalFollowers || (store as any).followerCount || 24500;
  const totalSales = (store as any).totalSales || 1240;
  const rating = (store as any).rating || 4.9;
  const tagline = (store as any).tagline || store.category || "Premium Quality Goods";

  const socialLinks = (store as any).socialLinks || [
    { handle: "@" + store.username, followerCount: 15000 },
    { handle: store.displayName, followerCount: 8000 },
    { handle: "@" + store.username, followerCount: 1500 }
  ];

  return (
    <div className="flex flex-col bg-background pb-6 border-b border-border/50">
      {/* Cover Banner */}
      <div className="w-full h-[180px] bg-muted relative">
        <img 
          src={(store as any).coverImage || defaultCover} 
          alt="Store Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="px-4 -mt-10 relative z-10">
        {/* Avatar & Action row */}
        <div className="flex justify-between items-end mb-3">
          <img 
            src={store.avatar || defaultAvatar} 
            alt={store.displayName}
            className="w-24 h-24 rounded-full object-cover border-[3px] border-background shadow-sm bg-white"
          />
          <div className="flex gap-2 mb-2">
            <button className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-full text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
              Follow Shop
            </button>
            <button className="bg-secondary text-secondary-foreground font-semibold px-4 py-2 rounded-full text-sm hover:bg-secondary/80 active:scale-95 transition-all shadow-sm">
              Message
            </button>
          </div>
        </div>

        {/* Name & Tagline */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-display font-bold leading-tight text-foreground">{store.displayName}</h1>
            {store.isVerified && (
              <BadgeCheck className="w-5 h-5 text-accent fill-accent/10 mt-1" />
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground mt-0.5">{tagline}</span>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-5 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 bg-card border border-card-border px-3 py-1.5 rounded-full shrink-0 shadow-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{totalFollowers.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-0.5">Followers</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-card-border px-3 py-1.5 rounded-full shrink-0 shadow-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{totalSales.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-0.5">Sales</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-card-border px-3 py-1.5 rounded-full shrink-0 shadow-sm">
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="text-sm font-semibold">{rating}</span>
            <span className="text-xs text-muted-foreground ml-0.5">Rating</span>
          </div>
        </div>

        {/* Platform Links */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {socialLinks.map((link: any, idx: number) => {
            return (
              <div key={idx} className="flex items-center gap-2 bg-secondary/60 pl-1 pr-3 py-1 rounded-full shrink-0 border border-border">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold leading-none">{link.handle}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {link.followerCount >= 1000 ? (link.followerCount / 1000).toFixed(1) + 'k' : link.followerCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bio Section */}
        <div className="text-sm text-foreground/90 leading-relaxed mb-4">
          <p className="whitespace-pre-wrap">{store.bio}</p>
        </div>

        <div className="flex flex-col gap-2">
          {store.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{store.location}</span>
            </div>
          )}
          {store.website && (
            <a href={store.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline font-medium w-fit">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">{store.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
