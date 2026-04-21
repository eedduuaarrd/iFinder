import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { useGetHuntItems, useGetCurrentHunt } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Check, Flame, Zap, Trophy, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { translateHuntItem, getItemEmoji, translateDifficulty } from "@/i18n/huntItems";
import { getStreakDays, isDailyBonusAvailable } from "@/lib/game-stats";

function getCountdown(endDate?: string | null): string {
  if (!endDate) return "";
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "0d 0h";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return `${d}d ${h}h`;
}

// Deterministic mock for "X% of hunters" — based on item id
function fakeFoundPercent(id: number): number {
  return 12 + ((id * 37) % 76);
}

export default function Hunt() {
  const [, setLocation] = useLocation();
  const { data: items, isLoading } = useGetHuntItems();
  const { data: hunt } = useGetCurrentHunt();
  const { t, lang } = useLang();

  const streak = getStreakDays();
  const dailyAvailable = isDailyBonusAvailable();

  const sorted = useMemo(() => {
    if (!items) return [];
    // Sort: unfound first, by difficulty asc (easy → insane)
    const order: Record<string, number> = { easy: 0, medium: 1, hard: 2, insane: 3 };
    return [...items].sort((a, b) => {
      if (a.found !== b.found) return a.found ? 1 : -1;
      const da = order[a.difficulty?.toLowerCase() ?? "medium"] ?? 1;
      const db = order[b.difficulty?.toLowerCase() ?? "medium"] ?? 1;
      return da - db;
    });
  }, [items]);

  const found = items?.filter((i) => i.found).length ?? 0;
  const total = items?.length ?? 10;
  const points = items?.filter((i) => i.found).reduce((s, i) => s + i.points, 0) ?? 0;
  const totalPoints = items?.reduce((s, i) => s + i.points, 0) ?? 0;
  const pct = total > 0 ? (found / total) * 100 : 0;

  // Pick a "daily challenge" item (deterministic per day) — first unfound after rotation
  const challengeItem = useMemo(() => {
    if (!items?.length) return null;
    const dayIndex = Math.floor(Date.now() / 86400000);
    const unfound = items.filter((i) => !i.found);
    if (unfound.length === 0) return null;
    return unfound[dayIndex % unfound.length];
  }, [items]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemAnim = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="pb-24">
      {/* Sticky progress bar */}
      <div className="sticky -mx-4 px-4 top-0 z-30 -mt-4 pt-4 pb-3 bg-background/95 backdrop-blur-md border-b-2 border-border mb-5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-primary uppercase tracking-tighter leading-none">
              {t("hunt.title")}
            </h1>
            <p className="text-muted-foreground uppercase font-mono text-[10px] mt-1">
              {t("hunt.subtitle")}
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl sm:text-3xl font-bold leading-none">
              <span className="text-primary">{found}</span>
              <span className="text-muted-foreground">/{total}</span>
            </div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">
              {points}/{totalPoints} {t("common.points")}
            </div>
          </div>
        </div>
        <div className="h-2 bg-card border border-border overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-muted-foreground">
            <Clock className="w-3 h-3 text-secondary" /> {t("hunt.timeLeft")}: <span className="text-foreground">{getCountdown(hunt?.weekEnd)}</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-orange-400">
              <Flame className="w-3 h-3" /> {t("hunt.streak")} {streak} {t("hunt.streakDays")}
            </div>
          )}
        </div>
      </div>

      {/* Bonus banners */}
      {(dailyAvailable || challengeItem) && (
        <div className="grid grid-cols-1 gap-2 mb-5">
          {dailyAvailable && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="border-2 border-secondary bg-secondary/10 p-3 flex items-center gap-3"
            >
              <Zap className="w-7 h-7 text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold uppercase text-secondary text-sm">{t("hunt.daily")}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground">{t("hunt.dailyDesc")}</div>
              </div>
            </motion.div>
          )}
          {challengeItem && !challengeItem.found && (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setLocation(`/camera/${challengeItem.id}`)}
              className="border-2 border-primary bg-primary/10 p-3 flex items-center gap-3 text-left hover:bg-primary/20 transition-colors"
            >
              <Trophy className="w-7 h-7 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold uppercase text-primary text-sm flex items-center gap-1">
                  <span className="text-base">{getItemEmoji(challengeItem.cocoLabel, challengeItem.requiredColor)}</span>
                  {translateHuntItem(challengeItem, lang).name}
                </div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground">
                  {lang === "ca" ? "REPTE DEL DIA — +" : lang === "es" ? "RETO DEL DÍA — +" : "DAILY CHALLENGE — +"}
                  {challengeItem.points * 2} {t("common.points")}
                </div>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {found === total && total > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 border-4 border-primary bg-primary text-primary-foreground p-4 text-center font-mono font-bold uppercase tracking-tighter text-xl shadow-[6px_6px_0px_0px_hsl(var(--foreground))]"
        >
          🏆 {t("hunt.completed")}
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-card rounded-none" />
          ))}
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {sorted.map((huntItem) => {
            const tr = translateHuntItem(huntItem, lang);
            const emoji = getItemEmoji(huntItem.cocoLabel, huntItem.requiredColor);
            const othersPct = fakeFoundPercent(huntItem.id);
            return (
              <motion.div key={huntItem.id} variants={itemAnim}>
                <button
                  onClick={() => !huntItem.found && setLocation(`/camera/${huntItem.id}`)}
                  disabled={huntItem.found}
                  className={`block w-full text-left p-4 border-2 transition-all touch-manipulation ${
                    huntItem.found
                      ? "border-primary/40 bg-card opacity-60"
                      : "border-primary bg-card cursor-pointer shadow-[4px_4px_0px_0px_hsl(var(--primary))] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_hsl(var(--primary))]"
                  }`}
                  data-testid={`button-hunt-item-${huntItem.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl leading-none shrink-0" aria-hidden>
                      {huntItem.found ? "✅" : emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg uppercase tracking-tight flex items-center gap-2 leading-tight">
                        <span className={huntItem.found ? "line-through text-muted-foreground" : ""}>{tr.name}</span>
                      </h3>
                      <p className={`text-xs font-mono mt-0.5 line-clamp-2 ${huntItem.found ? "text-muted-foreground" : "text-foreground/80"}`}>
                        {tr.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-none border-2 font-mono text-sm shrink-0 ${
                        huntItem.found ? "text-muted-foreground border-muted-foreground" : "text-primary border-primary bg-primary/10"
                      }`}
                    >
                      +{huntItem.points}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-none font-mono text-[10px] uppercase bg-secondary text-secondary-foreground">
                      {translateDifficulty(huntItem.difficulty, lang)}
                    </Badge>
                    {!huntItem.found && (
                      <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase border-muted-foreground text-muted-foreground">
                        {othersPct}% {t("hunt.others")}
                      </Badge>
                    )}
                    {huntItem.found ? (
                      <Badge className="ml-auto rounded-none font-mono text-[10px] uppercase bg-primary text-primary-foreground border-2 border-primary">
                        <Check className="w-3 h-3 mr-1" /> {t("hunt.found")}
                      </Badge>
                    ) : (
                      <span className="ml-auto font-mono text-[10px] uppercase text-primary tracking-widest">
                        {t("hunt.tap")} →
                      </span>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
