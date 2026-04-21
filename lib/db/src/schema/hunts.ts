import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const huntsTable = pgTable("hunts", {
  id: serial("id").primaryKey(),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  weekEnd: timestamp("week_end", { withTimezone: true }).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const huntItemsTable = pgTable("hunt_items", {
  id: serial("id").primaryKey(),
  huntId: integer("hunt_id").notNull().references(() => huntsTable.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cocoLabel: text("coco_label").notNull(),
  requiredColor: text("required_color"),
  points: integer("points").notNull().default(10),
  difficulty: text("difficulty").notNull().default("medium"),
  hint: text("hint"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertHuntSchema = createInsertSchema(huntsTable).omit({ id: true, createdAt: true });
export const insertHuntItemSchema = createInsertSchema(huntItemsTable).omit({ id: true });

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type InsertHuntItem = z.infer<typeof insertHuntItemSchema>;
export type Hunt = typeof huntsTable.$inferSelect;
export type HuntItem = typeof huntItemsTable.$inferSelect;
