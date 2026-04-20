import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMeResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    const email = (req as any).userEmail ?? `user_${userId}@flashhunt.app`;
    const username = `user_${userId.slice(0, 8)}`;
    const [newUser] = await db.insert(usersTable).values({
      id: userId,
      email,
      username,
      totalPoints: 0,
    }).returning();
    res.json(GetMeResponse.parse(newUser));
    return;
  }

  res.json(GetMeResponse.parse(user));
});

router.patch("/auth/profile", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, string> = {};
  if (parsed.data.username != null) updates.username = parsed.data.username;
  if (parsed.data.displayName != null) updates.displayName = parsed.data.displayName;
  if (parsed.data.city != null) updates.city = parsed.data.city;
  if (parsed.data.avatarUrl != null) updates.avatarUrl = parsed.data.avatarUrl;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateProfileResponse.parse(user));
});

export default router;
