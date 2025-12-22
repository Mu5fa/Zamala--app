import { questions, answers, users, type Question, type InsertQuestion, type Answer, type InsertAnswer, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // Questions
  getQuestions(subject?: string): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion & { userId: string }): Promise<Question>;
  
  // Answers
  getAnswers(questionId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer & { userId: string }): Promise<Answer>;
  rateAnswer(id: number): Promise<Answer | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getQuestions(subject?: string): Promise<Question[]> {
    if (subject) {
      return await db.select().from(questions).where(eq(questions.subject, subject)).orderBy(desc(questions.createdAt));
    }
    return await db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion & { userId: string }): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getAnswers(questionId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.questionId, questionId)).orderBy(desc(answers.rating));
  }

  async createAnswer(insertAnswer: InsertAnswer & { userId: string }): Promise<Answer> {
    const [answer] = await db.insert(answers).values(insertAnswer).returning();
    return answer;
  }

  async rateAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (!answer) return undefined;

    const [updatedAnswer] = await db.update(answers)
      .set({ rating: (answer.rating || 0) + 1 })
      .where(eq(answers.id, id))
      .returning();
    return updatedAnswer;
  }
}

export const storage = new DatabaseStorage();
