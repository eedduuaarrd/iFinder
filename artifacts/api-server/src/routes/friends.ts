import { Router, type IRouter } from "express";
import { eq, and, or, ilike, sql, desc, not } from "drizzle-orm";
import { db, usersTable, friendRequestsTable, friendshipsTable, submissionsTable, huntItemsTable, huntsTable } from "@workspace/db";
import {
  GetFriendsResponse,
  GetFriendRequestsResponse,
  SearchUsersQueryParams,
  SearchUsersResponse,
  SendFriendRequestBody,
  AcceptFriendRequestParams,
  RejectFriendRequestParams,
  RemoveFriendParams,
  AcceptFriendRequestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/friends", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const friendships = await db
    .select()
    .from(friendshipsTable)
    .where(eq(friendshipsTable.userId, userId));

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

  const friends = await Promise.all(
    friendships.map(async (f) => {
      const [friendUser] = await db.select().from(usersTable).where(eq(usersTable.id, f.friendId));
      if (!friendUser) return null;

      let lastActivity = null;
      let lastItemFound = null;
      let weekPoints = 0;

      if (hunt) {
        const [lastSubmission] = await db
          .select({
            foundAt: submissionsTable.foundAt,
            itemName: huntItemsTable.name,
            points: submissionsTable.pointsAwarded,
          })
          .from(submissionsTable)
          .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
          .where(
            and(
              eq(submissionsTable.userId, f.friendId),
              eq(huntItemsTable.huntId, hunt.id)
            )
          )
          .orderBy(desc(submissionsTable.foundAt))
          .limit(1);

        if (lastSubmission) {
          lastActivity = lastSubmission.foundAt.toISOString();
          lastItemFound = lastSubmission.itemName;
        }

        const [wpResult] = await db
          .select({
            total: sql<number>`SUM(${submissionsTable.pointsAwarded})`.as("total"),
          })
          .from(submissionsTable)
          .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
          .where(
            and(
              eq(submissionsTable.userId, f.friendId),
              eq(huntItemsTable.huntId, hunt.id)
            )
          );
        weekPoints = Number(wpResult?.total ?? 0);
      }

      return {
        id: f.id,
        userId: friendUser.id,
        username: friendUser.username,
        displayName: friendUser.displayName,
        avatarUrl: friendUser.avatarUrl,
        lastActivity,
        lastItemFound,
        weekPoints,
      };
    })
  );

  const validFriends = friends.filter(Boolean);
  res.json(GetFriendsResponse.parse(validFriends));
});

router.get("/friends/requests", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const requests = await db
    .select()
    .from(friendRequestsTable)
    .where(and(eq(friendRequestsTable.toUserId, userId), eq(friendRequestsTable.status, "pending")));

  const requestsWithUsers = await Promise.all(
    requests.map(async (r) => {
      const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.fromUserId));
      return {
        id: r.id,
        fromUserId: r.fromUserId,
        toUserId: r.toUserId,
        fromUsername: fromUser?.username ?? "unknown",
        fromDisplayName: fromUser?.displayName ?? null,
        fromAvatarUrl: fromUser?.avatarUrl ?? null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  res.json(GetFriendRequestsResponse.parse(requestsWithUsers));
});

router.get("/friends/search", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const parsedQuery = SearchUsersQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  const { q } = parsedQuery.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        or(
          ilike(usersTable.username, `%${q}%`),
          ilike(usersTable.email, `%${q}%`)
        ),
        userId ? not(eq(usersTable.id, userId)) : undefined
      )
    )
    .limit(20);

  res.json(SearchUsersResponse.parse(
    users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      totalPoints: u.totalPoints,
    }))
  ));
});

router.post("/friends/request", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SendFriendRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { toUserId } = parsed.data;

  const existing = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, userId), eq(friendRequestsTable.toUserId, toUserId)),
        and(eq(friendRequestsTable.fromUserId, toUserId), eq(friendRequestsTable.toUserId, userId))
      )
    );

  if (existing.length > 0) {
    res.status(400).json({ error: "Friend request already exists" });
    return;
  }

  const [request] = await db.insert(friendRequestsTable).values({
    fromUserId: userId,
    toUserId,
    status: "pending",
  }).returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    id: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    fromUsername: fromUser?.username ?? "unknown",
    fromDisplayName: fromUser?.displayName ?? null,
    fromAvatarUrl: fromUser?.avatarUrl ?? null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  });
});

router.post("/friends/request/:requestId/accept", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const params = AcceptFriendRequestParams.safeParse({ requestId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, params.data.requestId));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (request.toUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(friendRequestsTable)
    .set({ status: "accepted" })
    .where(eq(friendRequestsTable.id, request.id));

  await db.insert(friendshipsTable).values([
    { userId, friendId: request.fromUserId },
    { userId: request.fromUserId, friendId: userId },
  ]);

  const [friendUser] = await db.select().from(usersTable).where(eq(usersTable.id, request.fromUserId));

  res.json(AcceptFriendRequestResponse.parse({
    id: request.id,
    userId,
    username: friendUser?.username ?? "unknown",
    displayName: friendUser?.displayName ?? null,
    avatarUrl: friendUser?.avatarUrl ?? null,
    weekPoints: 0,
  }));
});

router.post("/friends/request/:requestId/reject", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const params = RejectFriendRequestParams.safeParse({ requestId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(friendRequestsTable)
    .set({ status: "rejected" })
    .where(eq(friendRequestsTable.id, params.data.requestId));

  res.sendStatus(204);
});

router.delete("/friends/:friendId", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.friendId) ? req.params.friendId[0] : req.params.friendId;
  const params = RemoveFriendParams.safeParse({ friendId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [friendship] = await db.select().from(friendshipsTable).where(eq(friendshipsTable.id, params.data.friendId));
  if (!friendship) {
    res.status(404).json({ error: "Friendship not found" });
    return;
  }

  await db.delete(friendshipsTable).where(
    or(
      and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendship.friendId)),
      and(eq(friendshipsTable.userId, friendship.friendId), eq(friendshipsTable.friendId, userId))
    )
  );

  res.sendStatus(204);
});

export default router;
