import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, usersTable, submissionsTable, huntItemsTable, huntsTable } from "@workspace/db";
import {
  GetUserProfileParams,
  GetUserProfileResponse,
  GetUserActivityParams,
  GetUserActivityQueryParams,
  GetUserActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = GetUserProfileParams.safeParse({ userId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

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

  let weekPoints = 0;
  let itemsFound = 0;

  if (hunt) {
    const [wpResult] = await db
      .select({
        total: sql<number>`SUM(${submissionsTable.pointsAwarded})`.as("total"),
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(submissionsTable)
      .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
      .where(
        and(
          eq(submissionsTable.userId, user.id),
          eq(huntItemsTable.huntId, hunt.id)
        )
      );
    weekPoints = Number(wpResult?.total ?? 0);
    itemsFound = Number(wpResult?.count ?? 0);
  }

  res.json(GetUserProfileResponse.parse({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    city: user.city,
    totalPoints: user.totalPoints,
    weekPoints,
    itemsFound,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.get("/users/:userId/activity", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = GetUserActivityParams.safeParse({ userId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsedQuery = GetUserActivityQueryParams.safeParse(req.query);
  const limit = parsedQuery.success ? (parsedQuery.data.limit ?? 5) : 5;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const submissions = await db
    .select({
      id: submissionsTable.id,
      userId: submissionsTable.userId,
      itemName: huntItemsTable.name,
      photoUrl: submissionsTable.photoUrl,
      points: submissionsTable.pointsAwarded,
      foundAt: submissionsTable.foundAt,
    })
    .from(submissionsTable)
    .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
    .where(eq(submissionsTable.userId, user.id))
    .orderBy(desc(submissionsTable.foundAt))
    .limit(limit);

  res.json(GetUserActivityResponse.parse(
    submissions.map(s => ({
      id: s.id,
      userId: s.userId,
      username: user.username,
      itemName: s.itemName,
      photoUrl: s.photoUrl,
      points: s.points,
      foundAt: s.foundAt.toISOString(),
    }))
  ));
});

export default router;
