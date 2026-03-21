import { useGetStore } from "@workspace/api-client-react";
import { BadgeCheck, Link as LinkIcon, MapPin, MoreHorizontal, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeader() {
  const { data: store, isLoading } = useGetStore();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 flex justify-around">
            <Skeleton className="w-12 h-10" />
            <Skeleton className="w-12 h-10" />
            <Skeleton className="w-12 h-10" />
          </div>
        </div>
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-full h-16" />
      </div>
    );
  }

  if (!store) return null;

  const defaultAvatar = `${import.meta.env.BASE_URL}images/default-avatar.png`;

  return (
    <div className="px-4 pt-4 pb-2 flex flex-col gap-4">
      {/* Top Bar - Username */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-display font-bold">{store.username}</h1>
          {store.isVerified && (
            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />
          )}
        </div>
        <button className="p-2 -mr-2 text-foreground active:opacity-50">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <img 
            src={store.avatar || defaultAvatar} 
            alt={store.displayName}
            className="w-20 h-20 rounded-full object-cover border border-border"
          />
          {/* Mock unread story ring if we wanted to show store has a story */}
          <div className="absolute -inset-[3px] rounded-full border-[2.5px] border-primary/20 -z-10" />
        </div>
        
        <div className="flex-1 flex justify-around items-center text-center">
          <div className="flex flex-col">
            <span className="font-bold text-lg">{store.postCount}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">{store.followerCount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">{store.followingCount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Following</span>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">{store.displayName}</span>
        {store.category && (
          <span className="text-muted-foreground text-xs">{store.category}</span>
        )}
        <p className="whitespace-pre-wrap leading-tight">{store.bio}</p>
        
        <div className="flex flex-col gap-1 mt-1">
          {store.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{store.location}</span>
            </div>
          )}
          {store.website && (
            <a href={store.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{store.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-1">
        <button className="flex-1 bg-primary text-primary-foreground font-semibold py-1.5 rounded-lg text-sm hover:bg-primary/90 active:scale-[0.98] transition-all">
          Follow
        </button>
        <button className="flex-1 bg-secondary text-secondary-foreground font-semibold py-1.5 rounded-lg text-sm hover:bg-secondary/80 active:scale-[0.98] transition-all">
          Message
        </button>
        <button className="px-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 active:scale-[0.98] transition-all">
          <User className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
