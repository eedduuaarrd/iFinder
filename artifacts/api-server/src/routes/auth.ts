import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, usersTable } from "@workspace/db";
import {
  GetMeResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeUser(user: Record<string, any>) {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, username, city } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ error: "Email, password and username are required" });
    return;
  }

  if (!city || typeof city !== "string" || city.trim().length < 2) {
    res.status(400).json({ error: "City is required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  const [user] = await db.insert(usersTable).values({
    id,
    email,
    username,
    passwordHash,
    city: city.trim(),
    totalPoints: 0,
  }).returning();

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );

  res.status(201).json(GetMeResponse.parse(serializeUser(user)));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );

  res.json(GetMeResponse.parse(serializeUser(user)));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(serializeUser(user)));
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

  res.json(UpdateProfileResponse.parse(serializeUser(user)));
});

export default router;
