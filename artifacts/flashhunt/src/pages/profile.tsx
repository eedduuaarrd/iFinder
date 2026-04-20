import React from "react";
import { useGetMe, useGetRankingStats, useGetMyMosaic } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Share2, MapPin, Award, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { signOut } = useAuth();
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: stats, isLoading: isLoadingStats } = useGetRankingStats();
  const { data: mosaic, isLoading: isLoadingMosaic } = useGetMyMosaic();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FlashHunt',
          text: `Check out my FlashHunt progress! Week Points: ${stats?.weekPoints || 0}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  if (isLoadingUser || isLoadingStats) {
    return (
      <div className="pb-24 space-y-6">
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-48 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold font-mono text-primary uppercase tracking-tighter">DOSSIER</h1>
        <Button variant="outline" size="sm" onClick={signOut} className="rounded-none border-2 font-mono uppercase text-xs h-8 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-transparent">
          <LogOut className="w-3 h-3 mr-2" /> LOGOUT
        </Button>
      </div>

      <Card className="p-6 rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground))] mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-6 relative z-10">
          <Avatar className="h-24 w-24 rounded-none border-4 border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary))]">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="rounded-none bg-black text-primary font-mono text-3xl font-bold">
              {user?.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">{user?.username}</h2>
            {user?.city && (
              <div className="flex items-center text-muted-foreground font-mono mt-1 text-sm uppercase">
                <MapPin className="w-4 h-4 mr-1 text-secondary" /> {user.city}
              </div>
            )}
            <div className="mt-3 inline-block bg-primary text-primary-foreground font-mono font-bold px-3 py-1 text-sm">
              TOTAL PTS: {user?.totalPoints || 0}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-4 rounded-none border-2 border-secondary bg-secondary/10 flex flex-col items-center text-center">
          <Award className="w-8 h-8 text-secondary mb-2" />
          <div className="text-3xl font-mono font-bold text-secondary">{stats?.weekPoints || 0}</div>
          <div className="text-xs font-mono uppercase text-muted-foreground mt-1">WEEK POINTS</div>
        </Card>
        <Card className="p-4 rounded-none border-2 border-primary bg-primary/10 flex flex-col items-center text-center">
          <Trophy className="w-8 h-8 text-primary mb-2" />
          <div className="text-3xl font-mono font-bold text-primary">#{stats?.globalRank || '-'}</div>
          <div className="text-xs font-mono uppercase text-muted-foreground mt-1">GLOBAL RANK</div>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center border-b-2 border-border pb-2 mb-4">
          <h2 className="text-sm font-mono text-muted-foreground uppercase">WEEKLY MOSAIC</h2>
          <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-none h-6 text-primary hover:text-primary hover:bg-primary/20 px-2 font-mono text-xs">
            <Share2 className="w-3 h-3 mr-1" /> SHARE
          </Button>
        </div>
        
        {isLoadingMosaic ? (
          <Skeleton className="w-full aspect-square rounded-none border-2 border-border bg-card" />
        ) : mosaic && mosaic.photos && mosaic.photos.length > 0 ? (
          <div className="border-2 border-foreground bg-black p-2">
            <div className="grid grid-cols-3 gap-2">
              {mosaic.photos.slice(0, 9).map((photo, i) => (
                <div key={i} className="aspect-square relative group overflow-hidden border border-border/50">
                  <img src={photo.photoUrl} alt={photo.itemName} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
              {/* Fill empty spots if less than 9 */}
              {[...Array(Math.max(0, 9 - mosaic.photos.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-card border border-border/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-border/30 rotate-45"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center border-2 border-dashed border-border rounded-none bg-transparent">
            <p className="text-muted-foreground font-mono uppercase text-sm">NO CAPTURES THIS WEEK</p>
          </Card>
        )}
      </div>
    </div>
  );
}
