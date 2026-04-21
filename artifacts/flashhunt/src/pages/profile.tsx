import React from "react";
import { useGetMe, useGetRankingStats, useGetMyMosaic } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Share2, MapPin, Award, Trophy, Languages, Flame, Star, Zap, Users, Crown, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/i18n/LanguageContext";
import { LANGS } from "@/i18n/translations";
import { getStats, getStreakDays } from "@/lib/game-stats";

const BADGE_DEFS = [
  { id: "first",      icon: Star,   color: "text-yellow-400",  borderColor: "border-yellow-400" },
  { id: "streak",     icon: Flame,  color: "text-orange-400",  borderColor: "border-orange-400" },
  { id: "speedster",  icon: Zap,    color: "text-secondary",   borderColor: "border-secondary" },
  { id: "completer",  icon: Crown,  color: "text-primary",     borderColor: "border-primary" },
  { id: "social",     icon: Users,  color: "text-blue-400",    borderColor: "border-blue-400" },
];

export default function Profile() {
  const { signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: stats, isLoading: isLoadingStats } = useGetRankingStats();
  const { data: mosaic, isLoading: isLoadingMosaic } = useGetMyMosaic();
  const gameStats = getStats();
  const streak = getStreakDays();

  const handleShare = async () => {
    const text =
      lang === "ca" ? `Mira el meu progrés a FlashHunt! Punts setmana: ${stats?.weekPoints || 0}` :
      lang === "es" ? `¡Mira mi progreso en FlashHunt! Puntos semana: ${stats?.weekPoints || 0}` :
      `Check out my FlashHunt progress! Week Points: ${stats?.weekPoints || 0}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FlashHunt", text, url: window.location.href });
      } catch {}
    } else {
      try { await navigator.clipboard.writeText(text + " " + window.location.href); } catch {}
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
        <h1 className="text-3xl font-bold font-mono text-primary uppercase tracking-tighter">{t("profile.title")}</h1>
        <Button variant="outline" size="sm" onClick={signOut} className="rounded-none border-2 font-mono uppercase text-xs h-8 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-transparent" data-testid="button-logout">
          <LogOut className="w-3 h-3 mr-2" /> {t("profile.logout")}
        </Button>
      </div>

      <Card className="p-6 rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground))] mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-5 relative z-10">
          <Avatar className="h-20 w-20 rounded-none border-4 border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary))]">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="rounded-none bg-black text-primary font-mono text-2xl font-bold">
              {user?.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold uppercase tracking-tight truncate">{user?.username}</h2>
            {user?.city && (
              <div className="flex items-center text-muted-foreground font-mono mt-1 text-xs uppercase">
                <MapPin className="w-3 h-3 mr-1 text-secondary" /> {user.city}
              </div>
            )}
            <div className="mt-2 inline-block bg-primary text-primary-foreground font-mono font-bold px-2 py-1 text-xs">
              {t("profile.totalPts")}: {user?.totalPoints || 0}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="p-3 rounded-none border-2 border-secondary bg-secondary/10 flex flex-col items-center text-center">
          <Award className="w-6 h-6 text-secondary mb-1" />
          <div className="text-2xl font-mono font-bold text-secondary leading-none">{stats?.weekPoints || 0}</div>
          <div className="text-[9px] font-mono uppercase text-muted-foreground mt-1 leading-tight">{t("profile.weekPoints")}</div>
        </Card>
        <Card className="p-3 rounded-none border-2 border-primary bg-primary/10 flex flex-col items-center text-center">
          <Trophy className="w-6 h-6 text-primary mb-1" />
          <div className="text-2xl font-mono font-bold text-primary leading-none">#{stats?.globalRank || "-"}</div>
          <div className="text-[9px] font-mono uppercase text-muted-foreground mt-1 leading-tight">{t("profile.globalRank")}</div>
        </Card>
        <Card className="p-3 rounded-none border-2 border-orange-400 bg-orange-400/10 flex flex-col items-center text-center">
          <Flame className="w-6 h-6 text-orange-400 mb-1" />
          <div className="text-2xl font-mono font-bold text-orange-400 leading-none">{streak}</div>
          <div className="text-[9px] font-mono uppercase text-muted-foreground mt-1 leading-tight">{t("hunt.streak")} {t("hunt.streakDays")}</div>
        </Card>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase border-b-2 border-border pb-2 mb-3">
          {t("profile.badges")}
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {BADGE_DEFS.map((b) => {
            const owned = gameStats.badges.includes(b.id);
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`aspect-square border-2 flex flex-col items-center justify-center p-1 ${
                  owned ? `${b.borderColor} bg-card` : "border-border bg-card/40 opacity-50"
                }`}
              >
                {owned ? (
                  <Icon className={`w-7 h-7 ${b.color}`} />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div className={`text-[8px] font-mono uppercase mt-1 leading-none text-center ${owned ? b.color : "text-muted-foreground"}`}>
                  {t(`profile.badge.${b.id}`)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center border-b-2 border-border pb-2 mb-3">
          <h2 className="text-sm font-mono text-muted-foreground uppercase">{t("profile.weeklyMosaic")}</h2>
          <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-none h-7 text-primary hover:text-primary hover:bg-primary/20 px-2 font-mono text-xs">
            <Share2 className="w-3 h-3 mr-1" /> {t("profile.share")}
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
              {[...Array(Math.max(0, 9 - mosaic.photos.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-card border border-border/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-border/30 rotate-45"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center border-2 border-dashed border-border rounded-none bg-transparent">
            <p className="text-muted-foreground font-mono uppercase text-sm">{t("profile.noCaptures")}</p>
          </Card>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-mono text-muted-foreground uppercase border-b-2 border-border pb-2 mb-3 flex items-center gap-2">
          <Languages className="w-4 h-4" /> {t("profile.language")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              data-testid={`button-profile-lang-${l.code}`}
              className={`px-3 py-3 border-2 font-mono font-bold uppercase text-xs transition-all ${
                lang === l.code
                  ? "bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
                  : "bg-card text-foreground border-border hover:border-primary"
              }`}
            >
              <div className="text-xl">{l.flag}</div>
              <div className="text-[9px] mt-1 opacity-80">{l.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
