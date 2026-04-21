import React from "react";
import { useGetGlobalRanking, useGetLocalRanking, useGetFriendsRanking, useGetMe } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Rankings() {
  const { t } = useLang();
  const { data: user } = useGetMe();
  const { data: globalRanking, isLoading: isLoadingGlobal } = useGetGlobalRanking();
  const { data: localRanking, isLoading: isLoadingLocal } = useGetLocalRanking({ city: user?.city || "New York" });
  const { data: friendsRanking, isLoading: isLoadingFriends } = useGetFriendsRanking();

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } };

  const renderRankingList = (rankingData: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2 mt-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-card rounded-none" />
          ))}
        </div>
      );
    }

    if (!rankingData || rankingData.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground font-mono uppercase mt-4">
          {t("rankings.empty")}
        </div>
      );
    }

    return (
      <motion.div className="space-y-2 mt-4" variants={container} initial="hidden" animate="show">
        {rankingData.map((entry) => {
          const medal = MEDAL[entry.rank];
          return (
            <motion.div key={entry.userId} variants={item}>
              <Card
                className={`flex items-center p-3 rounded-none border-2 ${
                  entry.isCurrentUser
                    ? "border-primary bg-primary/10 shadow-[3px_3px_0px_0px_hsl(var(--primary))]"
                    : entry.rank <= 3
                    ? "border-foreground bg-card"
                    : "border-border bg-card"
                }`}
              >
                <div className={`w-10 font-mono font-bold text-center mr-3 shrink-0 ${
                  entry.rank === 1 ? "text-2xl" :
                  entry.rank <= 3 ? "text-xl" :
                  "text-base text-muted-foreground"
                }`}>
                  {medal ?? `#${entry.rank}`}
                </div>

                <Avatar className="h-10 w-10 rounded-none border-2 border-foreground mr-3 shrink-0">
                  <AvatarImage src={entry.avatarUrl || ""} />
                  <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground font-bold font-mono text-xs">
                    {entry.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="font-bold uppercase truncate text-sm flex items-center gap-2">
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span className="bg-primary text-primary-foreground font-mono text-[9px] uppercase px-1 border border-primary">
                        {t("rankings.you")}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase truncate">
                    {entry.itemsFound}/10 {t("rankings.foundShort")}
                  </div>
                </div>

                <div className="text-right ml-2 shrink-0">
                  <div className="font-bold font-mono text-primary text-lg leading-none">{entry.points}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">{t("common.points")}</div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="pb-24">
      <h1 className="text-3xl font-bold font-mono text-secondary uppercase tracking-tighter mb-6">
        {t("rankings.title")}
      </h1>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card rounded-none p-1 border-2 border-border mb-4 h-12">
          <TabsTrigger value="global" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-xs">
            {t("rankings.global")}
          </TabsTrigger>
          <TabsTrigger value="local" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-xs">
            {t("rankings.local")}
          </TabsTrigger>
          <TabsTrigger value="friends" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-xs">
            {t("rankings.friends")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">{renderRankingList(globalRanking || [], isLoadingGlobal)}</TabsContent>
        <TabsContent value="local">{renderRankingList(localRanking || [], isLoadingLocal)}</TabsContent>
        <TabsContent value="friends">{renderRankingList(friendsRanking || [], isLoadingFriends)}</TabsContent>
      </Tabs>
    </div>
  );
}
