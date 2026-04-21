import React, { useState, useEffect } from "react";
import {
  useGetMe,
  useGetRankingStats,
  useGetMyMosaic,
  useUpdateProfile,
  type MosaicDataPhotosItem,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Share2,
  MapPin,
  Award,
  Trophy,
  Languages,
  Flame,
  Star,
  Zap,
  Users,
  Crown,
  Lock,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/i18n/LanguageContext";
import { LANGS } from "@/i18n/translations";
import { getStats, getStreakDays } from "@/lib/game-stats";

const BADGE_DEFS = [
  { id: "first",     icon: Star,  color: "text-amber-400",   bg: "bg-amber-400/10",   ring: "ring-amber-400/30" },
  { id: "streak",    icon: Flame, color: "text-orange-400",  bg: "bg-orange-400/10",  ring: "ring-orange-400/30" },
  { id: "speedster", icon: Zap,   color: "text-secondary",   bg: "bg-secondary/10",   ring: "ring-secondary/30" },
  { id: "completer", icon: Crown, color: "text-primary",     bg: "bg-primary/10",     ring: "ring-primary/30" },
  { id: "social",    icon: Users, color: "text-sky-400",     bg: "bg-sky-400/10",     ring: "ring-sky-400/30" },
];

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Profile() {
  const { signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const { data: user, isLoading: isLoadingUser, refetch: refetchUser } = useGetMe();
  const { data: stats, isLoading: isLoadingStats } = useGetRankingStats();
  const { data: mosaic, isLoading: isLoadingMosaic } = useGetMyMosaic();
  const updateProfile = useUpdateProfile();
  const gameStats = getStats();
  const streak = getStreakDays();

  const [cityInput, setCityInput] = useState("");
  const [savedFlash, setSavedFlash] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    if (user?.city) setCityInput(titleCase(user.city));
  }, [user?.city]);

  const handleShare = async () => {
    const text =
      lang === "ca" ? `Mira el meu progrés a iFinder! Punts setmana: ${stats?.weekPoints || 0}` :
      lang === "es" ? `¡Mira mi progreso en iFinder! Puntos semana: ${stats?.weekPoints || 0}` :
      `Check out my iFinder progress! Week points: ${stats?.weekPoints || 0}`;
    if (navigator.share) {
      try { await navigator.share({ title: "iFinder", text, url: window.location.href }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text + " " + window.location.href); } catch {}
    }
  };

  const handleSaveSettings = async () => {
    const trimmed = cityInput.trim();
    if (trimmed.length < 2) return;
    try {
      await updateProfile.mutateAsync({ data: { city: trimmed } });
      await refetchUser();
      setSavedFlash("ok");
      setTimeout(() => setSavedFlash(null), 2000);
    } catch {
      setSavedFlash("err");
      setTimeout(() => setSavedFlash(null), 2500);
    }
  };

  if (isLoadingUser || isLoadingStats) {
    return (
      <div className="pb-24 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gradient-primary">{t("profile.title")}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="rounded-xl text-xs h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          data-testid="button-logout"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> {t("profile.logout")}
        </Button>
      </div>

      {/* Profile header card */}
      <Card className="p-5 rounded-2xl glass shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-primary/40 shadow-lg">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="rounded-2xl gradient-primary text-primary-foreground font-bold text-2xl">
              {user?.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight truncate">{user?.username}</h2>
            {user?.city && (
              <div className="flex items-center text-muted-foreground mt-1 text-sm">
                <MapPin className="w-4 h-4 mr-1 text-secondary" /> {titleCase(user.city)}
              </div>
            )}
            <div className="mt-2 inline-flex items-center gap-1 gradient-primary text-primary-foreground font-semibold px-3 py-1 text-xs rounded-full shadow">
              <Trophy className="w-3 h-3" /> {user?.totalPoints || 0} {t("profile.totalPts")}
            </div>
          </div>
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 rounded-2xl bg-secondary/10 border-secondary/30 flex flex-col items-center text-center">
          <Award className="w-6 h-6 text-secondary mb-1" />
          <div className="text-2xl font-extrabold text-secondary leading-none">{stats?.weekPoints || 0}</div>
          <div className="text-[10px] uppercase text-muted-foreground mt-1 leading-tight">{t("profile.weekPoints")}</div>
        </Card>
        <Card className="p-3 rounded-2xl bg-primary/10 border-primary/30 flex flex-col items-center text-center">
          <Trophy className="w-6 h-6 text-primary mb-1" />
          <div className="text-2xl font-extrabold text-primary leading-none">#{stats?.globalRank || "-"}</div>
          <div className="text-[10px] uppercase text-muted-foreground mt-1 leading-tight">{t("profile.globalRank")}</div>
        </Card>
        <Card className="p-3 rounded-2xl bg-orange-400/10 border-orange-400/30 flex flex-col items-center text-center">
          <Flame className="w-6 h-6 text-orange-400 mb-1" />
          <div className="text-2xl font-extrabold text-orange-400 leading-none">{streak}</div>
          <div className="text-[10px] uppercase text-muted-foreground mt-1 leading-tight">{t("hunt.streak")} {t("hunt.streakDays")}</div>
        </Card>
      </div>

      {/* Badges */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("profile.badges")}
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {BADGE_DEFS.map((b) => {
            const owned = gameStats.badges.includes(b.id);
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1.5 transition-all ${
                  owned ? `${b.bg} ring-1 ${b.ring}` : "bg-muted/40 opacity-50"
                }`}
              >
                {owned ? <Icon className={`w-7 h-7 ${b.color}`} /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                <div className={`text-[9px] uppercase mt-1 leading-none text-center font-medium ${owned ? b.color : "text-muted-foreground"}`}>
                  {t(`profile.badge.${b.id}`)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mosaic */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("profile.weeklyMosaic")}</h2>
          <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-xl h-8 text-primary hover:text-primary hover:bg-primary/10 px-3 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1" /> {t("profile.share")}
          </Button>
        </div>

        {isLoadingMosaic ? (
          <Skeleton className="w-full aspect-square rounded-2xl" />
        ) : mosaic && mosaic.photos && mosaic.photos.length > 0 ? (
          <div className="rounded-2xl glass p-2">
            <div className="grid grid-cols-3 gap-2">
              {mosaic.photos.slice(0, 9).map((photo: MosaicDataPhotosItem, i: number) => (
                <div key={i} className="aspect-square relative group overflow-hidden rounded-xl">
                  <img src={photo.photoUrl} alt={photo.itemName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
              {[...Array(Math.max(0, 9 - mosaic.photos.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-xl bg-muted/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-border" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center rounded-2xl border-dashed bg-transparent">
            <p className="text-muted-foreground text-sm">{t("profile.noCaptures")}</p>
          </Card>
        )}
      </section>

      {/* Settings */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" /> {t("profile.settings")}
        </h2>
        <Card className="rounded-2xl p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-city" className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {t("profile.editCity")}
            </Label>
            <Input
              id="profile-city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="rounded-xl border bg-background/60 h-11 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
              maxLength={64}
              data-testid="input-profile-city"
            />
            <p className="text-[11px] text-muted-foreground">{t("profile.cityHint")}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Languages className="w-3.5 h-3.5" /> {t("profile.language")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  data-testid={`button-profile-lang-${l.code}`}
                  className={`py-2.5 rounded-xl font-semibold uppercase text-xs transition-all border ${
                    lang === l.code
                      ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                      : "bg-muted/30 text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg leading-none">{l.flag}</div>
                  <div className="text-[10px] mt-1 opacity-80">{l.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveSettings}
              disabled={updateProfile.isPending || cityInput.trim().length < 2}
              className="rounded-xl gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11 px-5 shadow-md disabled:opacity-60"
              data-testid="button-save-settings"
            >
              {savedFlash === "ok" ? <Check className="w-4 h-4 mr-2" /> : null}
              {updateProfile.isPending ? "…" : t("profile.saveSettings")}
            </Button>
            {savedFlash === "ok" && (
              <span className="text-xs text-primary font-medium">{t("profile.saved")}</span>
            )}
            {savedFlash === "err" && (
              <span className="text-xs text-destructive font-medium">{t("profile.saveError")}</span>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
