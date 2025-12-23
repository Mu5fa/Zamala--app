import { pgTable, text, serial, integer, timestamp, varchar, boolean, primaryKey } from "drizzle-orm/pg-core";
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
  role: text("role").default("user"), // "user" or "admin"
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

export const answerRatings = pgTable("answer_ratings", {
  answerId: integer("answer_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.answerId, table.userId] }),
}));

export const questionReports = pgTable("question_reports", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  reportedBy: integer("reported_by").notNull(),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answerReports = pgTable("answer_reports", {
  id: serial("id").primaryKey(),
  answerId: integer("answer_id").notNull(),
  reportedBy: integer("reported_by").notNull(),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionTags = pgTable("question_tags", {
  questionId: integer("question_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.questionId, table.tagId] }),
}));

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  unique: primaryKey({ columns: [table.userId, table.questionId] }),
}));

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

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AnswerRating = typeof answerRatings.$inferSelect;

export const insertQuestionReportSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type QuestionReport = typeof questionReports.$inferSelect;
export type InsertQuestionReport = z.infer<typeof insertQuestionReportSchema>;

export const insertAnswerReportSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type AnswerReport = typeof answerReports.$inferSelect;
export type InsertAnswerReport = z.infer<typeof insertAnswerReportSchema>;

export type Tag = typeof tags.$inferSelect;
export type QuestionTag = typeof questionTags.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  answerId: integer("answer_id"),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Comment = typeof comments.$inferSelect;
export const insertCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "answer", "comment", "rating"
  content: text("content").notNull(),
  questionId: integer("question_id"),
  answerId: integer("answer_id"),
  fromUserId: integer("from_user_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
