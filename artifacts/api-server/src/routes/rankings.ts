import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, usersTable, submissionsTable, huntItemsTable, huntsTable, friendshipsTable } from "@workspace/db";
import {
  GetGlobalRankingQueryParams,
  GetGlobalRankingResponse,
  GetLocalRankingQueryParams,
  GetLocalRankingResponse,
  GetFriendsRankingResponse,
  GetRankingStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getCurrentHuntId(): Promise<number | null> {
  const now = new Date();
  const [hunt] = await db
    .select()
    .from(huntsTable)
    .where(
      and(
        sql`${huntsTable.weekStart} <= ${now}`,
        sql`${huntsTable.weekEnd} >= ${now}`
      )
    )
    .limit(1);
  return hunt?.id ?? null;
}

async function getWeekPoints(huntId: number) {
  const rows = await db
    .select({
      userId: submissionsTable.userId,
      weekPoints: sql<number>`SUM(${submissionsTable.pointsAwarded})`.as("week_points"),
      itemsFound: sql<number>`COUNT(*)`.as("items_found"),
    })
    .from(submissionsTable)
    .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
    .where(eq(huntItemsTable.huntId, huntId))
    .groupBy(submissionsTable.userId);
  return rows;
}

router.get("/rankings/global", async (req, res): Promise<void> => {
  const parsedQuery = GetGlobalRankingQueryParams.safeParse(req.query);
  const limit = parsedQuery.success ? (parsedQuery.data.limit ?? 50) : 50;
  const currentUserId = (req as any).userId;

  const huntId = await getCurrentHuntId();
  if (!huntId) {
    res.json([]);
    return;
  }

  const weekPointsRows = await getWeekPoints(huntId);
  const weekPointsMap = new Map(weekPointsRows.map(r => [r.userId, r]));

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.totalPoints)).limit(limit);

  const ranked = users.map((user, index) => {
    const wp = weekPointsMap.get(user.id);
    return {
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      city: user.city,
      points: Number(wp?.weekPoints ?? 0),
      itemsFound: Number(wp?.itemsFound ?? 0),
      isCurrentUser: user.id === currentUserId,
    };
  });

  res.json(GetGlobalRankingResponse.parse(ranked));
});

router.get("/rankings/local", async (req, res): Promise<void> => {
  const parsedQuery = GetLocalRankingQueryParams.safeParse(req.query);
  const limit = parsedQuery.success ? (parsedQuery.data.limit ?? 50) : 50;
  const city = parsedQuery.success ? parsedQuery.data.city : undefined;
  const currentUserId = (req as any).userId;

  const huntId = await getCurrentHuntId();
  if (!huntId) {
    res.json([]);
    return;
  }

  const weekPointsRows = await getWeekPoints(huntId);
  const weekPointsMap = new Map(weekPointsRows.map(r => [r.userId, r]));

  let usersQuery = db.select().from(usersTable);
  const users = city
    ? await usersQuery.where(eq(usersTable.city, city)).orderBy(desc(usersTable.totalPoints)).limit(limit)
    : await usersQuery.orderBy(desc(usersTable.totalPoints)).limit(limit);

  const ranked = users.map((user, index) => {
    const wp = weekPointsMap.get(user.id);
    return {
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      city: user.city,
      points: Number(wp?.weekPoints ?? 0),
      itemsFound: Number(wp?.itemsFound ?? 0),
      isCurrentUser: user.id === currentUserId,
    };
  });

  res.json(GetLocalRankingResponse.parse(ranked));
});

router.get("/rankings/friends", async (req, res): Promise<void> => {
  const currentUserId = (req as any).userId;
  if (!currentUserId) {
    res.json([]);
    return;
  }

  const huntId = await getCurrentHuntId();
  if (!huntId) {
    res.json([]);
    return;
  }

  const friendships = await db
    .select()
    .from(friendshipsTable)
    .where(eq(friendshipsTable.userId, currentUserId));

  const friendIds = friendships.map(f => f.friendId);
  const allIds = [currentUserId, ...friendIds];

  const weekPointsRows = await getWeekPoints(huntId);
  const weekPointsMap = new Map(weekPointsRows.map(r => [r.userId, r]));

  const users = await db.select().from(usersTable);
  const filteredUsers = users.filter(u => allIds.includes(u.id));

  filteredUsers.sort((a, b) => {
    const aPoints = Number(weekPointsMap.get(a.id)?.weekPoints ?? 0);
    const bPoints = Number(weekPointsMap.get(b.id)?.weekPoints ?? 0);
    return bPoints - aPoints;
  });

  const ranked = filteredUsers.map((user, index) => {
    const wp = weekPointsMap.get(user.id);
    return {
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      city: user.city,
      points: Number(wp?.weekPoints ?? 0),
      itemsFound: Number(wp?.itemsFound ?? 0),
      isCurrentUser: user.id === currentUserId,
    };
  });

  res.json(GetFriendsRankingResponse.parse(ranked));
});

router.get("/rankings/stats", async (req, res): Promise<void> => {
  const currentUserId = (req as any).userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const huntId = await getCurrentHuntId();
  let weekPoints = 0;
  let globalRank = null;
  let localRank = null;
  let friendsRank = null;

  if (huntId) {
    const weekPointsRows = await getWeekPoints(huntId);
    const myWeekPoints = weekPointsRows.find(r => r.userId === currentUserId);
    weekPoints = Number(myWeekPoints?.weekPoints ?? 0);

    const sortedGlobal = [...weekPointsRows].sort((a, b) => Number(b.weekPoints) - Number(a.weekPoints));
    const globalIdx = sortedGlobal.findIndex(r => r.userId === currentUserId);
    if (globalIdx >= 0) globalRank = globalIdx + 1;

    if (user.city) {
      const cityUsers = await db.select().from(usersTable).where(eq(usersTable.city, user.city));
      const cityIds = new Set(cityUsers.map(u => u.id));
      const sortedLocal = weekPointsRows.filter(r => cityIds.has(r.userId)).sort((a, b) => Number(b.weekPoints) - Number(a.weekPoints));
      const localIdx = sortedLocal.findIndex(r => r.userId === currentUserId);
      if (localIdx >= 0) localRank = localIdx + 1;
    }

    const friendships = await db.select().from(friendshipsTable).where(eq(friendshipsTable.userId, currentUserId));
    const friendIds = new Set([currentUserId, ...friendships.map(f => f.friendId)]);
    const sortedFriends = weekPointsRows.filter(r => friendIds.has(r.userId)).sort((a, b) => Number(b.weekPoints) - Number(a.weekPoints));
    const friendsIdx = sortedFriends.findIndex(r => r.userId === currentUserId);
    if (friendsIdx >= 0) friendsRank = friendsIdx + 1;
  }

  res.json(GetRankingStatsResponse.parse({
    globalRank,
    localRank,
    friendsRank,
    weekPoints,
    totalPoints: user.totalPoints,
    city: user.city,
  }));
});

export default router;
