import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, submissionsTable, huntItemsTable, huntsTable, usersTable } from "@workspace/db";
import {
  SubmitHuntItemBody,
  GetMySubmissionsResponse,
  GetMyMosaicResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/submissions", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SubmitHuntItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { huntItemId, photoUrl, detectedLabel, detectedColor, confidence, latitude, longitude } = parsed.data;

  const [item] = await db.select().from(huntItemsTable).where(eq(huntItemsTable.id, huntItemId));
  if (!item) {
    res.status(404).json({ error: "Hunt item not found" });
    return;
  }

  const existing = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.userId, userId), eq(submissionsTable.huntItemId, huntItemId)));

  if (existing.length > 0) {
    res.status(400).json({ error: "Already submitted for this item" });
    return;
  }

  const [submission] = await db.insert(submissionsTable).values({
    userId,
    huntItemId,
    photoUrl,
    detectedLabel,
    detectedColor: detectedColor ?? null,
    confidence,
    pointsAwarded: item.points,
    status: "accepted",
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  }).returning();

  await db.update(usersTable)
    .set({ totalPoints: sql`${usersTable.totalPoints} + ${item.points}` })
    .where(eq(usersTable.id, userId));

  res.status(201).json({
    id: submission.id,
    userId: submission.userId,
    huntItemId: submission.huntItemId,
    photoUrl: submission.photoUrl,
    detectedLabel: submission.detectedLabel,
    detectedColor: submission.detectedColor,
    confidence: submission.confidence,
    pointsAwarded: submission.pointsAwarded,
    status: submission.status,
    foundAt: submission.foundAt.toISOString(),
  });
});

router.get("/submissions/my", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.userId, userId))
    .orderBy(desc(submissionsTable.foundAt));

  res.json(GetMySubmissionsResponse.parse(
    submissions.map(s => ({
      ...s,
      detectedColor: s.detectedColor,
      foundAt: s.foundAt.toISOString(),
    }))
  ));
});

router.get("/submissions/mosaic", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
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

  if (!hunt) {
    res.json(GetMyMosaicResponse.parse({
      huntTitle: "No current hunt",
      weekStart: new Date().toISOString(),
      photos: [],
      totalPoints: 0,
      totalItems: 0,
    }));
    return;
  }

  const rows = await db
    .select({
      itemName: huntItemsTable.name,
      photoUrl: submissionsTable.photoUrl,
      points: huntItemsTable.points,
    })
    .from(submissionsTable)
    .innerJoin(huntItemsTable, eq(submissionsTable.huntItemId, huntItemsTable.id))
    .where(
      and(
        eq(submissionsTable.userId, userId),
        eq(huntItemsTable.huntId, hunt.id)
      )
    );

  const totalPoints = rows.reduce((sum, r) => sum + r.points, 0);

  res.json(GetMyMosaicResponse.parse({
    huntTitle: hunt.title,
    weekStart: hunt.weekStart.toISOString(),
    photos: rows,
    totalPoints,
    totalItems: rows.length,
  }));
});

export default router;
