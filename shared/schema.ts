import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(), // رياضيات، علوم، عربي، إنجليزي، etc
  content: text("content").notNull(),
  imageUrl: text("image_url"), // URL للصورة المرفوعة
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  rating: integer("rating").default(0), // عدد التقييمات
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  subject: true,
  content: true,
  imageUrl: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  questionId: true,
  content: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
