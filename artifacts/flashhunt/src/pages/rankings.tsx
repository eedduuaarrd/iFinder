import React, { useState } from "react";
import { useGetGlobalRanking, useGetLocalRanking, useGetFriendsRanking, useGetMe } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Rankings() {
  const { data: user } = useGetMe();
  const { data: globalRanking, isLoading: isLoadingGlobal } = useGetGlobalRanking();
  const { data: localRanking, isLoading: isLoadingLocal } = useGetLocalRanking({ city: user?.city || "New York" });
  const { data: friendsRanking, isLoading: isLoadingFriends } = useGetFriendsRanking();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
  };

  const renderRankingList = (rankingData: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-3 mt-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-card rounded-none" />
          ))}
        </div>
      );
    }

    return (
      <motion.div 
        className="space-y-3 mt-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {rankingData?.map((entry) => (
          <motion.div key={entry.userId} variants={item}>
            <Card className={`flex items-center p-3 rounded-none border-2 ${
              entry.isCurrentUser 
                ? "border-primary bg-primary/10" 
                : "border-border bg-card"
            }`}>
              <div className={`w-8 font-mono font-bold text-xl text-center mr-4 ${
                entry.rank === 1 ? "text-primary text-3xl" :
                entry.rank === 2 ? "text-primary/80 text-2xl" :
                entry.rank === 3 ? "text-primary/60 text-2xl" :
                "text-muted-foreground"
              }`}>
                #{entry.rank}
              </div>
              
              <Avatar className="h-10 w-10 rounded-none border-2 border-foreground mr-3">
                <AvatarImage src={entry.avatarUrl || ""} />
                <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground font-bold font-mono">
                  {entry.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 overflow-hidden">
                <div className="font-bold uppercase truncate">{entry.username}</div>
                <div className="text-xs text-muted-foreground font-mono uppercase truncate">
                  {entry.itemsFound}/10 FOUND
                </div>
              </div>
              
              <div className="text-right ml-2">
                <div className="font-bold font-mono text-primary text-lg">{entry.points}</div>
                <div className="text-[10px] text-muted-foreground uppercase">PTS</div>
              </div>
            </Card>
          </motion.div>
        ))}
        {rankingData?.length === 0 && (
          <div className="text-center p-8 text-muted-foreground font-mono uppercase">
            NO DATA YET
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="pb-24">
      <h1 className="text-3xl font-bold font-mono text-secondary uppercase tracking-tighter mb-6">LEADERBOARD</h1>
      
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card rounded-none p-1 border-2 border-border mb-4 h-12">
          <TabsTrigger value="global" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">GLOBAL</TabsTrigger>
          <TabsTrigger value="local" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">LOCAL</TabsTrigger>
          <TabsTrigger value="friends" className="rounded-none font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">CREW</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          {renderRankingList(globalRanking || [], isLoadingGlobal)}
        </TabsContent>
        <TabsContent value="local">
          {renderRankingList(localRanking || [], isLoadingLocal)}
        </TabsContent>
        <TabsContent value="friends">
          {renderRankingList(friendsRanking || [], isLoadingFriends)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
