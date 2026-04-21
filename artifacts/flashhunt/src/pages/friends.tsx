import React, { useState } from "react";
import { useGetFriends, useGetFriendRequests, useSearchUsers, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFriendsQueryKey, getGetFriendRequestsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Check, X, UserMinus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/LanguageContext";

export default function Friends() {
  const { t } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends();
  const { data: requests } = useGetFriendRequests();
  const { data: searchResults, refetch: refetchSearch } = useSearchUsers({ q: searchQuery });
  
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetchSearch();
    }
  };

  const handleSendRequest = (userId: string) => {
    sendRequest.mutate({ data: { toUserId: userId } }, {
      onSuccess: () => {
        toast({ title: t("friends.requestSent"), description: t("friends.requestSentDesc") });
        setSearchQuery("");
      },
      onError: (err: any) => {
        toast({ title: t("common.error"), description: err?.message ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleAccept = (requestId: number) => {
    acceptRequest.mutate({ requestId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
        toast({ title: t("friends.accepted"), description: t("friends.acceptedDesc") });
      },
      onError: (err: any) => {
        toast({ title: t("common.error"), description: err?.message ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleReject = (requestId: number) => {
    rejectRequest.mutate({ requestId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
      }
    });
  };

  const handleRemove = (friendId: number) => {
    removeFriend.mutate({ friendId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
      }
    });
  };

  return (
    <div className="pb-24">
      <h1 className="text-3xl font-bold font-mono text-primary uppercase tracking-tighter mb-6">{t("friends.title")}</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input 
          placeholder={t("friends.search")} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono uppercase bg-card"
        />
        <Button type="submit" className="rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90">
          <Search className="w-5 h-5" />
        </Button>
      </form>

      {searchQuery && searchResults && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-mono text-muted-foreground uppercase mb-3 border-b-2 border-border pb-1">{t("friends.searchResults")}</h2>
          <div className="space-y-2">
            {searchResults.map(user => (
              <Card key={user.id} className="p-3 rounded-none border-2 flex items-center justify-between bg-card">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 rounded-none mr-3">
                    <AvatarImage src={user.avatarUrl || ""} />
                    <AvatarFallback className="rounded-none bg-muted font-mono">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold uppercase">{user.username}</span>
                </div>
                <Button size="sm" onClick={() => handleSendRequest(user.id)} className="rounded-none h-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-2 border-transparent">
                  <UserPlus className="w-4 h-4 mr-1" /> {t("friends.add")}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-mono text-secondary uppercase mb-3 border-b-2 border-secondary pb-1">{t("friends.pending")}</h2>
          <div className="space-y-2">
            {requests.map(req => (
              <Card key={req.id} className="p-3 rounded-none border-2 border-secondary bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 rounded-none border-2 border-foreground mr-3">
                      <AvatarImage src={req.fromAvatarUrl || ""} />
                      <AvatarFallback className="rounded-none bg-secondary font-mono">{req.fromUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold uppercase">{req.fromUsername}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" onClick={() => handleAccept(req.id)} className="h-8 w-8 rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={() => handleReject(req.id)} variant="destructive" className="h-8 w-8 rounded-none">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-mono text-muted-foreground uppercase mb-3 border-b-2 border-border pb-1">{t("friends.allies")}</h2>
        {isLoadingFriends ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-16 w-full bg-card rounded-none border-2 border-border animate-pulse" />
            ))}
          </div>
        ) : friends && friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map(friend => (
              <Card key={friend.id} className="p-3 rounded-none border-2 border-border bg-card flex items-center justify-between hover:border-primary transition-colors">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 rounded-none border-2 border-foreground mr-3">
                    <AvatarImage src={friend.avatarUrl || ""} />
                    <AvatarFallback className="rounded-none bg-muted font-mono">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold uppercase">{friend.username}</div>
                    {friend.lastItemFound && (
                      <div className="text-xs text-muted-foreground font-mono uppercase truncate max-w-[150px]">
                        {t("friends.foundLabel")} {friend.lastItemFound}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="font-bold font-mono text-primary">{friend.weekPoints}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{t("friends.weekPts")}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(friend.id)} className="h-8 w-8 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground font-mono uppercase border-2 border-dashed border-border mt-4">
            {t("friends.alone")}
            <br />{t("friends.findFriends")}
          </div>
        )}
      </div>
    </div>
  );
}
