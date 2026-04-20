import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, huntsTable, huntItemsTable, submissionsTable } from "@workspace/db";
import {
  GetCurrentHuntResponse,
  GetHuntItemsQueryParams,
  GetHuntItemsResponse,
  GetMyProgressResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getCurrentHunt() {
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
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [newHunt] = await db.insert(huntsTable).values({
      weekStart,
      weekEnd,
      title: `Week Hunt #${Math.floor(Date.now() / 604800000)}`,
    }).returning();

    await db.insert(huntItemsTable).values([
      { huntId: newHunt.id, name: "Red Chair", description: "Find a red chair anywhere", cocoLabel: "chair", requiredColor: "red", points: 10, difficulty: "easy", sortOrder: 1 },
      { huntId: newHunt.id, name: "Bicycle", description: "Spot a bicycle locked or parked", cocoLabel: "bicycle", requiredColor: null, points: 15, difficulty: "easy", hint: "Check near shops or building entrances", sortOrder: 2 },
      { huntId: newHunt.id, name: "Dog", description: "Find a dog on a walk", cocoLabel: "dog", requiredColor: null, points: 10, difficulty: "easy", sortOrder: 3 },
      { huntId: newHunt.id, name: "Traffic Light", description: "Photograph a traffic light", cocoLabel: "traffic light", requiredColor: null, points: 5, difficulty: "easy", sortOrder: 4 },
      { huntId: newHunt.id, name: "Bus", description: "Capture a bus in motion or stopped", cocoLabel: "bus", requiredColor: null, points: 20, difficulty: "medium", sortOrder: 5 },
      { huntId: newHunt.id, name: "Laptop", description: "Find someone using a laptop", cocoLabel: "laptop", requiredColor: null, points: 15, difficulty: "medium", hint: "Cafes and libraries are good spots", sortOrder: 6 },
      { huntId: newHunt.id, name: "Potted Plant", description: "Find a plant in a pot", cocoLabel: "potted plant", requiredColor: null, points: 10, difficulty: "easy", sortOrder: 7 },
      { huntId: newHunt.id, name: "Backpack", description: "Spot a backpack being worn", cocoLabel: "backpack", requiredColor: null, points: 10, difficulty: "easy", sortOrder: 8 },
      { huntId: newHunt.id, name: "Motorcycle", description: "Find a parked or moving motorcycle", cocoLabel: "motorcycle", requiredColor: null, points: 20, difficulty: "medium", sortOrder: 9 },
      { huntId: newHunt.id, name: "Bench", description: "Find a bench in a public space", cocoLabel: "bench", requiredColor: null, points: 10, difficulty: "easy", sortOrder: 10 },
    ]);

    return newHunt;
  }

  return hunt;
}

router.get("/hunt/current", async (_req, res): Promise<void> => {
  const hunt = await getCurrentHunt();
  const items = await db
    .select()
    .from(huntItemsTable)
    .where(eq(huntItemsTable.huntId, hunt.id));

  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);

  res.json(GetCurrentHuntResponse.parse({
    id: hunt.id,
    weekStart: hunt.weekStart.toISOString(),
    weekEnd: hunt.weekEnd.toISOString(),
    title: hunt.title,
    totalPoints,
    itemCount: items.length,
  }));
});

router.get("/hunt/current/items", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const parsedQuery = GetHuntItemsQueryParams.safeParse(req.query);
  const queryUserId = parsedQuery.success ? parsedQuery.data.userId : userId;

  const hunt = await getCurrentHunt();

  const items = await db
    .select()
    .from(huntItemsTable)
    .where(eq(huntItemsTable.huntId, hunt.id))
    .orderBy(huntItemsTable.sortOrder);

  if (!queryUserId) {
    const itemsWithStatus = items.map(item => ({
      ...item,
      found: false,
      submissionId: null,
      photoUrl: null,
      foundAt: null,
    }));
    res.json(GetHuntItemsResponse.parse(itemsWithStatus));
    return;
  }

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, queryUserId),
        sql`${submissionsTable.huntItemId} IN (SELECT id FROM hunt_items WHERE hunt_id = ${hunt.id})`
      )
    );

  const submissionMap = new Map(submissions.map(s => [s.huntItemId, s]));

  const itemsWithStatus = items.map(item => {
    const submission = submissionMap.get(item.id);
    return {
      ...item,
      found: !!submission,
      submissionId: submission?.id ?? null,
      photoUrl: submission?.photoUrl ?? null,
      foundAt: submission?.foundAt?.toISOString() ?? null,
    };
  });

  res.json(GetHuntItemsResponse.parse(itemsWithStatus));
});

router.get("/hunt/current/progress", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const hunt = await getCurrentHunt();
  const items = await db
    .select()
    .from(huntItemsTable)
    .where(eq(huntItemsTable.huntId, hunt.id));

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, userId),
        sql`${submissionsTable.huntItemId} IN (SELECT id FROM hunt_items WHERE hunt_id = ${hunt.id})`
      )
    );

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const pointsEarned = submissions.reduce((sum, s) => sum + s.pointsAwarded, 0);
  const itemsFound = submissions.length;

  res.json(GetMyProgressResponse.parse({
    huntId: hunt.id,
    userId,
    itemsFound,
    totalItems: items.length,
    pointsEarned,
    totalPoints,
    completionPercent: items.length > 0 ? (itemsFound / items.length) * 100 : 0,
  }));
});

export default router;
