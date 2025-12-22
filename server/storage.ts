import { questions, answers, users, type Question, type InsertQuestion, type Answer, type InsertAnswer, type User } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getQuestions(subject?: string): Promise<(Question & { username: string; grade: string })[]>;
  getQuestion(id: number): Promise<(Question & { username: string; grade: string }) | undefined>;
  createQuestion(question: InsertQuestion, userId: number): Promise<Question>;
  
  getAnswers(questionId: number): Promise<(Answer & { username: string; grade: string })[]>;
  createAnswer(answer: InsertAnswer, questionId: number, userId: number): Promise<Answer>;
  rateAnswer(id: number): Promise<Answer | undefined>;
  
  getTopAnswerers(limit?: number): Promise<(User & { totalHelpfulness: number })[]>;
  getTopAskers(limit?: number): Promise<(User & { questionsAsked: number })[]>;
}

export class DatabaseStorage implements IStorage {
  async getQuestions(subject?: string): Promise<(Question & { username: string; grade: string })[]> {
    let query = db.select({
      ...questions,
      username: users.username,
      grade: users.grade,
    }).from(questions).innerJoin(users, eq(questions.userId, users.id));
    
    if (subject) {
      query = query.where(eq(questions.subject, subject));
    }
    
    return query.orderBy(desc(questions.createdAt));
  }

  async getQuestion(id: number): Promise<(Question & { username: string; grade: string }) | undefined> {
    const [question] = await db.select({
      ...questions,
      username: users.username,
      grade: users.grade,
    }).from(questions).innerJoin(users, eq(questions.userId, users.id)).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion, userId: number): Promise<Question> {
    const [question] = await db.insert(questions).values({
      ...insertQuestion,
      userId
    }).returning();
    
    await db.update(users).set({
      questionsAsked: sql`${users.questionsAsked} + 1`
    }).where(eq(users.id, userId));
    
    return question;
  }

  async getAnswers(questionId: number): Promise<(Answer & { username: string; grade: string })[]> {
    return await db.select({
      ...answers,
      username: users.username,
      grade: users.grade,
    }).from(answers).innerJoin(users, eq(answers.userId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.rating));
  }

  async createAnswer(insertAnswer: InsertAnswer, questionId: number, userId: number): Promise<Answer> {
    const [answer] = await db.insert(answers).values({
      ...insertAnswer,
      questionId,
      userId
    }).returning();
    
    await db.update(users).set({
      answersGiven: sql`${users.answersGiven} + 1`
    }).where(eq(users.id, userId));
    
    return answer;
  }

  async rateAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (!answer) return undefined;

    const [updatedAnswer] = await db.update(answers)
      .set({ rating: (answer.rating || 0) + 1 })
      .where(eq(answers.id, id))
      .returning();
    
    await db.update(users).set({
      totalHelpfulness: sql`${users.totalHelpfulness} + 1`
    }).where(eq(users.id, answer.userId));
    
    return updatedAnswer;
  }

  async getTopAnswerers(limit = 5): Promise<(User & { totalHelpfulness: number })[]> {
    return await db.select().from(users)
      .orderBy(desc(users.totalHelpfulness))
      .limit(limit);
  }

  async getTopAskers(limit = 5): Promise<(User & { questionsAsked: number })[]> {
    return await db.select().from(users)
      .orderBy(desc(users.questionsAsked))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
