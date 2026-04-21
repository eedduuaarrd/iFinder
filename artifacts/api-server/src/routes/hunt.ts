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

// Larger pool of items, deterministic weekly rotation picks 10 each week.
type PoolItem = {
  name: string;
  description: string;
  cocoLabel: string;
  requiredColor: string | null;
  points: number;
  difficulty: "easy" | "medium" | "hard" | "insane";
  hint?: string;
};

const ITEM_POOL: PoolItem[] = [
  { name: "Chair", description: "Find a chair anywhere", cocoLabel: "chair", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Red Chair", description: "Find a red chair", cocoLabel: "chair", requiredColor: "red", points: 20, difficulty: "medium" },
  { name: "Bicycle", description: "Spot a bicycle locked or parked", cocoLabel: "bicycle", requiredColor: null, points: 15, difficulty: "easy", hint: "Check near shops or building entrances" },
  { name: "Dog", description: "Find a dog on a walk", cocoLabel: "dog", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Traffic Light", description: "Photograph a traffic light", cocoLabel: "traffic light", requiredColor: null, points: 5, difficulty: "easy" },
  { name: "Bus", description: "Capture a bus in motion or stopped", cocoLabel: "bus", requiredColor: null, points: 20, difficulty: "medium" },
  { name: "Laptop", description: "Find someone using a laptop", cocoLabel: "laptop", requiredColor: null, points: 15, difficulty: "medium", hint: "Cafes and libraries are good spots" },
  { name: "Potted Plant", description: "Find a plant in a pot", cocoLabel: "potted plant", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Backpack", description: "Spot a backpack being worn", cocoLabel: "backpack", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Motorcycle", description: "Find a parked or moving motorcycle", cocoLabel: "motorcycle", requiredColor: null, points: 20, difficulty: "medium" },
  { name: "Bench", description: "Find a bench in a public space", cocoLabel: "bench", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Car", description: "Capture a car", cocoLabel: "car", requiredColor: null, points: 5, difficulty: "easy" },
  { name: "Blue Car", description: "Find a blue car", cocoLabel: "car", requiredColor: "blue", points: 25, difficulty: "medium" },
  { name: "Yellow Car", description: "Find a yellow car", cocoLabel: "car", requiredColor: "yellow", points: 30, difficulty: "hard" },
  { name: "Fire Hydrant", description: "Find a fire hydrant on the street", cocoLabel: "fire hydrant", requiredColor: null, points: 15, difficulty: "medium" },
  { name: "Stop Sign", description: "Photograph a STOP sign", cocoLabel: "stop sign", requiredColor: null, points: 10, difficulty: "easy" },
  { name: "Bird", description: "Capture a wild bird", cocoLabel: "bird", requiredColor: null, points: 20, difficulty: "medium", hint: "Pigeons, gulls, sparrows count!" },
  { name: "Cat", description: "Find a cat outside", cocoLabel: "cat", requiredColor: null, points: 25, difficulty: "hard", hint: "Quiet corners and rooftops" },
  { name: "Umbrella", description: "Find an open umbrella", cocoLabel: "umbrella", requiredColor: null, points: 30, difficulty: "hard", hint: "Hope it rains!" },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Anchored to a fixed Monday in 2024 so weeks rotate deterministically across deploys.
const EPOCH_MONDAY = Date.UTC(2024, 0, 1);

function getWeekIndex(d: Date = new Date()): number {
  return Math.floor((d.getTime() - EPOCH_MONDAY) / WEEK_MS);
}

// Mulberry32 PRNG for stable, deterministic shuffles per week index.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeeklyItems(weekIndex: number, count = 10): PoolItem[] {
  const rand = mulberry32(weekIndex * 2654435761);
  const arr = [...ITEM_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date; weekIndex: number } {
  const now = new Date();
  const weekIndex = getWeekIndex(now);
  const weekStart = new Date(EPOCH_MONDAY + weekIndex * WEEK_MS);
  const weekEnd = new Date(weekStart.getTime() + WEEK_MS);
  return { weekStart, weekEnd, weekIndex };
}

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

  if (hunt) return hunt;

  const { weekStart, weekEnd, weekIndex } = getCurrentWeekRange();
  const [newHunt] = await db.insert(huntsTable).values({
    weekStart,
    weekEnd,
    title: `Weekly Hunt #${weekIndex}`,
  }).returning();

  const picks = pickWeeklyItems(weekIndex, 10);
  await db.insert(huntItemsTable).values(
    picks.map((p, idx) => ({
      huntId: newHunt.id,
      name: p.name,
      description: p.description,
      cocoLabel: p.cocoLabel,
      requiredColor: p.requiredColor,
      points: p.points,
      difficulty: p.difficulty,
      hint: p.hint ?? null,
      sortOrder: idx + 1,
    }))
  );

  return newHunt;
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
