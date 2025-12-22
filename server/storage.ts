import { questions, answers, users, answerRatings, questionReports, answerReports, type Question, type InsertQuestion, type Answer, type InsertAnswer, type User, type QuestionReport, type InsertQuestionReport, type AnswerReport, type InsertAnswerReport } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  getQuestions(subject?: string): Promise<(Question & { username: string; grade: string })[]>;
  getQuestion(id: number): Promise<(Question & { username: string; grade: string }) | undefined>;
  createQuestion(question: InsertQuestion, userId: number): Promise<Question>;
  
  getAnswers(questionId: number): Promise<(Answer & { username: string; grade: string })[]>;
  createAnswer(answer: InsertAnswer, questionId: number, userId: number): Promise<Answer>;
  rateAnswer(id: number, userId: number): Promise<{ answer: Answer; alreadyRated: boolean } | undefined>;
  
  getTopAnswerers(limit?: number): Promise<(User & { totalHelpfulness: number })[]>;
  getTopAskers(limit?: number): Promise<(User & { questionsAsked: number })[]>;
  
  reportQuestion(questionId: number, userId: number, reason: string): Promise<QuestionReport>;
  reportAnswer(answerId: number, userId: number, reason: string): Promise<AnswerReport>;
  getReports(): Promise<any[]>;
  resolveReport(reportId: number, type: 'question' | 'answer'): Promise<void>;
  deleteQuestion(questionId: number): Promise<void>;
  deleteAnswer(answerId: number): Promise<void>;
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

  async rateAnswer(id: number, userId: number): Promise<{ answer: Answer; alreadyRated: boolean } | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (!answer) return undefined;

    // Check if user already rated this answer
    const [existingRating] = await db.select().from(answerRatings)
      .where(and(eq(answerRatings.answerId, id), eq(answerRatings.userId, userId)));
    
    if (existingRating) {
      return { answer, alreadyRated: true };
    }

    // Add rating
    await db.insert(answerRatings).values({ answerId: id, userId });

    const [updatedAnswer] = await db.update(answers)
      .set({ rating: (answer.rating || 0) + 1 })
      .where(eq(answers.id, id))
      .returning();
    
    await db.update(users).set({
      totalHelpfulness: sql`${users.totalHelpfulness} + 1`
    }).where(eq(users.id, answer.userId));
    
    return { answer: updatedAnswer, alreadyRated: false };
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

  async reportQuestion(questionId: number, userId: number, reason: string): Promise<QuestionReport> {
    const [report] = await db.insert(questionReports).values({
      questionId,
      reportedBy: userId,
      reason,
    }).returning();
    return report;
  }

  async getReports(): Promise<(QuestionReport & { questionContent: string; reporterName: string; questionAskerName: string })[]> {
    return await db.select({
      ...questionReports,
      questionContent: questions.content,
      reporterName: users.username,
      questionAskerName: users.username,
    }).from(questionReports)
      .innerJoin(questions, eq(questionReports.questionId, questions.id))
      .innerJoin(users, eq(questionReports.reportedBy, users.id))
      .where(eq(questionReports.resolved, false))
      .orderBy(desc(questionReports.createdAt));
  }

  async reportAnswer(answerId: number, userId: number, reason: string): Promise<AnswerReport> {
    const [report] = await db.insert(answerReports).values({
      answerId,
      reportedBy: userId,
      reason,
    }).returning();
    return report;
  }

  async getReports(): Promise<any[]> {
    const questionReportsList = await db.select({
      id: questionReports.id,
      type: sql<string>`'question'`,
      contentId: questionReports.questionId,
      content: questions.content,
      reporterName: users.username,
      reason: questionReports.reason,
      createdAt: questionReports.createdAt,
    }).from(questionReports)
      .innerJoin(questions, eq(questionReports.questionId, questions.id))
      .innerJoin(users, eq(questionReports.reportedBy, users.id))
      .where(eq(questionReports.resolved, false));

    const answerReportsList = await db.select({
      id: answerReports.id,
      type: sql<string>`'answer'`,
      contentId: answerReports.answerId,
      content: answers.content,
      reporterName: users.username,
      reason: answerReports.reason,
      createdAt: answerReports.createdAt,
    }).from(answerReports)
      .innerJoin(answers, eq(answerReports.answerId, answers.id))
      .innerJoin(users, eq(answerReports.reportedBy, users.id))
      .where(eq(answerReports.resolved, false));

    return [...questionReportsList, ...answerReportsList].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async resolveReport(reportId: number, type: 'question' | 'answer'): Promise<void> {
    if (type === 'question') {
      await db.update(questionReports)
        .set({ resolved: true })
        .where(eq(questionReports.id, reportId));
    } else {
      await db.update(answerReports)
        .set({ resolved: true })
        .where(eq(answerReports.id, reportId));
    }
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await db.delete(answers).where(eq(answers.questionId, questionId));
    await db.delete(questionReports).where(eq(questionReports.questionId, questionId));
    await db.delete(questions).where(eq(questions.id, questionId));
  }

  async deleteAnswer(answerId: number): Promise<void> {
    await db.delete(answerReports).where(eq(answerReports.answerId, answerId));
    await db.delete(answers).where(eq(answers.id, answerId));
  }
}

export const storage = new DatabaseStorage();
