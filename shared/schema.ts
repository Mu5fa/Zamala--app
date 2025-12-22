import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  grade: integer("grade").notNull(), // 4, 5, 6
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  grade: true,
  content: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  questionId: true,
  content: true,
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
