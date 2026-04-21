import { pgTable, text, integer, timestamp, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { huntItemsTable } from "./hunts";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  huntItemId: integer("hunt_item_id").notNull().references(() => huntItemsTable.id),
  photoUrl: text("photo_url").notNull(),
  detectedLabel: text("detected_label").notNull(),
  detectedColor: text("detected_color"),
  confidence: real("confidence").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  status: text("status").notNull().default("accepted"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  foundAt: timestamp("found_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, foundAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
