import { questions, answers, type Question, type InsertQuestion, type Answer, type InsertAnswer } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getQuestions(grade?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  getAnswers(questionId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  likeAnswer(id: number): Promise<Answer | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getQuestions(grade?: number): Promise<Question[]> {
    if (grade) {
      return await db.select().from(questions).where(eq(questions.grade, grade)).orderBy(desc(questions.createdAt));
    }
    return await db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getAnswers(questionId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.questionId, questionId)).orderBy(desc(answers.likes));
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db.insert(answers).values(insertAnswer).returning();
    return answer;
  }

  async likeAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (!answer) return undefined;

    const [updatedAnswer] = await db.update(answers)
      .set({ likes: (answer.likes || 0) + 1 })
      .where(eq(answers.id, id))
      .returning();
    return updatedAnswer;
  }
}

export const storage = new DatabaseStorage();
