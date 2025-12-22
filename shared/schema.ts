import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  grade: text("grade").notNull(), // "4th", "5th", "6th"
  questionsAsked: integer("questions_asked").default(0),
  answersGiven: integer("answers_given").default(0),
  totalHelpfulness: integer("total_helpfulness").default(0), // sum of ratings received
  isGoldenColleague: boolean("is_golden_colleague").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  subject: true,
  content: true,
  imageUrl: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  content: true,
});

export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  grade: z.enum(["4th", "5th", "6th"]),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
